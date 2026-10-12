--!nonstrict
--[[
	GameServer  ·  Car Detailing Tycoon
	Script  ->  ServerScriptService

	The authoritative half of the game. The client is treated as hostile: it may
	ask for things, but every price, every hit on a dirty panel, every pound in
	the wallet and every byte that is saved is decided here.

	What this script owns
	  · Profiles: a session-locked, auto-saving profile store in the style of
	    ProfileService, running on DataStoreService in live servers and on an
	    in-memory mock in Studio when API access is off.
	  · The world: roads, plots, the Hardware Supply Store, every plot's wash
	    bay / pick-up bay / service desk / customer lounge / van garage. It is
	    built procedurally, so the place works from an empty Baseplate.
	  · The starter quest: drive the Caddy to the store, collect the kit, drive
	    home, name the company (filtered through TextService), launch an advert.
	  · The customer loop: pathfinding customer cars, the four-layer dirt
	    engine, server-side raycast validation of every hit, live billing, the
	    pick-up bay, the walking NPC customer, and the lump-sum payout.
	  · Van customisation: sign writing, paint, and a grid-attachment interior.

	Network contract (ReplicatedStorage.NetworkEvents)
	  CleanCarEvent      C->S (dirtPart, hitPosition, rayOrigin)    S->C hit result
	  ClaimPaymentEvent  C->S (jobId)                               S->C Ready / Paid
	  UpgradeVanEvent    C->S (action, payload)                     S->C zone + results
	  QuestEvent         C->S ("SubmitCompanyName", name)           S->C stage, modals
	  CommerceEvent      C->S (action, id, extra)                   S->C results
	  NotifyEvent        S->C (text, kind)
	  DataSyncEvent      S->C (snapshot)
	  SnapshotFunction   C->S ("Catalogue" | nil) -> table
	The first three are the ones the brief names; the rest are created here if
	they are missing, so the place needs nothing set up by hand.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")
local TextService = game:GetService("TextService")
local PathfindingService = game:GetService("PathfindingService")
local PhysicsService = game:GetService("PhysicsService")
local CollectionService = game:GetService("CollectionService")
local HttpService = game:GetService("HttpService")
local Workspace = game:GetService("Workspace")

--------------------------------------------------------------------------------
-- CONFIGURATION
--------------------------------------------------------------------------------

local CONFIG = {
	DataStoreName = "CarDetailingTycoon_Profiles_v1",
	ProfileKeyPrefix = "Player_",
	AutoSaveInterval = 75, -- seconds between background saves of every profile
	PrioritySaveGap = 6, -- minimum seconds between "save now" requests per profile
	SessionLockStale = 1800, -- a lock untouched for this long is treated as abandoned
	LoadAttempts = 6,
	LoadRetryDelay = 3,

	PlotCount = 6,
	PlotSpacing = 140,

	StartingCash = 10,
	MaxCash = 1e15,
	MaxQueuedCustomers = 20,
	MaxPropsPerType = 6,

	HitsPerSegment = 4, -- 4 hits x 0.25 transparency = fully clean
	ToolRange = 24, -- studs between the character and the surface being treated
	CameraMaxZoom = 55, -- bounds how far a claimed ray origin may sit from the head
	PayoutRange = 34,
	CustomiseRange = 45,

	VanMaxSpeed = 58, -- used by the teleport sanity check, not by the drive code
	CustomerDriveSpeed = 22,
	CustomerSpawnDelay = 2.5,
	NpcWalkSpeed = 10,

	SignWritingPrice = 15,
	PaintPrice = 25,
	RecoverVanCooldown = 8,
}

local RIDE = {
	VanChassisHeight = 2.1, -- chassis centre above the driving surface
	CarRootHeight = 1.3, -- customer car root centre above the driving surface
}

--------------------------------------------------------------------------------
-- CATALOGUE  (the single source of truth; the client receives a copy)
--------------------------------------------------------------------------------

-- Hand kit. Not equippable: they are prerequisites the power tools need.
local KIT_ITEMS = {
	Bucket = {
		DisplayName = "Bucket",
		Icon = "🪣",
		Order = 1,
		Description = "Mixing bucket. The Steam Extractor needs one.",
	},
	Sponge = {
		DisplayName = "Sponge",
		Icon = "🧽",
		Order = 2,
		Description = "Wash mitt and pads. Polishers and buffers need one.",
	},
	Hose = {
		DisplayName = "Hose",
		Icon = "🚿",
		Order = 3,
		Description = "Water feed. The High-Pressure Washer needs one.",
	},
}

-- Power tools: the four that treat the four dirt layers.
local TOOLS = {
	HighPressureWasher = {
		DisplayName = "High-Pressure Washer",
		Icon = "💦",
		Order = 1,
		Price = 150,
		Requires = { "Hose" },
		FireInterval = 0.14,
		Color = Color3.fromRGB(255, 196, 0),
		Description = "Blasts heavy mud off the bodywork.",
	},
	RotaryPolisher = {
		DisplayName = "Rotary Polisher",
		Icon = "🌀",
		Order = 2,
		Price = 900,
		Requires = { "Sponge" },
		FireInterval = 0.18,
		Color = Color3.fromRGB(235, 70, 60),
		Description = "Cuts deep scratches out of the clear coat.",
	},
	SteamExtractor = {
		DisplayName = "Steam Extractor",
		Icon = "♨️",
		Order = 3,
		Price = 1600,
		Requires = { "Bucket" },
		FireInterval = 0.18,
		Color = Color3.fromRGB(60, 150, 235),
		Description = "Lifts stains out of seats and carpets.",
	},
	DrillBuffer = {
		DisplayName = "Drill Buffer",
		Icon = "🛠️",
		Order = 4,
		Price = 3200,
		Requires = { "Sponge" },
		FireInterval = 0.2,
		Color = Color3.fromRGB(40, 200, 120),
		Description = "Buffs a ceramic coat into the paint.",
	},
}

local CHEMICALS = {
	SnowFoam = {
		DisplayName = "Snow Foam",
		Icon = "🫧",
		Order = 1,
		Price = 40,
		Color = Color3.fromRGB(235, 245, 255),
		Description = "Thick pre-wash foam that loosens mud.",
	},
	CuttingCompound = {
		DisplayName = "Cutting Compound",
		Icon = "🧴",
		Order = 2,
		Price = 350,
		Color = Color3.fromRGB(255, 150, 90),
		Description = "Abrasive paste for scratch removal.",
	},
	FabricCleaner = {
		DisplayName = "Fabric Cleaner",
		Icon = "🧼",
		Order = 3,
		Price = 500,
		Color = Color3.fromRGB(140, 210, 255),
		Description = "Enzyme cleaner for upholstery stains.",
	},
	CeramicCoating = {
		DisplayName = "Ceramic Coating",
		Icon = "💎",
		Order = 4,
		Price = 1200,
		Color = Color3.fromRGB(150, 255, 230),
		Description = "Hard-wearing protective paint seal.",
	},
}

-- The multi-layer dirt engine. Every segment needs exactly this tool with
-- exactly this chemical loaded; Value is what each validated hit adds to the bill.
local DIRT_LAYERS = {
	HeavyMud = {
		DisplayName = "Heavy Mud",
		Order = 1,
		Tool = "HighPressureWasher",
		Chemical = "SnowFoam",
		Value = 25,
		Segments = { 5, 7 },
		Color = Color3.fromRGB(102, 72, 44),
	},
	DeepScratches = {
		DisplayName = "Deep Scratches",
		Order = 2,
		Tool = "RotaryPolisher",
		Chemical = "CuttingCompound",
		Value = 75,
		Segments = { 3, 5 },
		Color = Color3.fromRGB(214, 218, 224),
	},
	InteriorStains = {
		DisplayName = "Interior Stains",
		Order = 3,
		Tool = "SteamExtractor",
		Chemical = "FabricCleaner",
		Value = 50,
		Segments = { 3, 4 },
		Color = Color3.fromRGB(86, 58, 34),
	},
	ProtectiveSeal = {
		DisplayName = "Protective Seal",
		Order = 4,
		Tool = "DrillBuffer",
		Chemical = "CeramicCoating",
		Value = 150,
		Segments = { 2, 3 },
		Color = Color3.fromRGB(226, 230, 236),
	},
}

local ADVERTS = {
	LeafletDrop = {
		DisplayName = "Leaflet Drop",
		Icon = "📄",
		Order = 1,
		Price = 5,
		Customers = 1,
		Description = "Flyers through the doors on your street. One customer.",
	},
	LocalRadio = {
		DisplayName = "Local Radio Spot",
		Icon = "📻",
		Order = 2,
		Price = 250,
		Customers = 3,
		Description = "Thirty seconds on drive-time radio. Three customers.",
	},
	SocialBoost = {
		DisplayName = "Social Media Boost",
		Icon = "📱",
		Order = 3,
		Price = 600,
		Customers = 6,
		Description = "A boosted before-and-after reel. Six customers.",
	},
}

-- Interior props for the van's cargo grid. W x D is the footprint in cells.
local VAN_PROPS = {
	ChemicalRack = { DisplayName = "Chemical Bottle Rack", Icon = "🧪", Order = 1, Price = 120, W = 1, D = 2 },
	DrillBitOrganiser = { DisplayName = "Drill Bit Organiser", Icon = "🧰", Order = 2, Price = 60, W = 1, D = 1 },
	UtilityShelf = { DisplayName = "Utility Shelving Unit", Icon = "🗄️", Order = 3, Price = 220, W = 2, D = 1 },
	HoseReel = { DisplayName = "Hose Reel", Icon = "🌀", Order = 4, Price = 90, W = 1, D = 1 },
	WaterTank = { DisplayName = "Water Tank", Icon = "🛢️", Order = 5, Price = 400, W = 2, D = 2 },
}

local VAN_GRID = {
	Cols = 3,
	Rows = 4,
	CellX = 1.7,
	CellZ = 2.1,
}

-- Plot structures. Core ones are unlocked from the start; the rest are
-- purchasable and raise what every hit is worth on this plot.
local PLOT_STRUCTURES = {
	WashBay = { DisplayName = "Wash Bay", Core = true, Order = 1, Price = 0, Bonus = 0 },
	PickUpBay = { DisplayName = "Pick-Up Bay", Core = true, Order = 2, Price = 0, Bonus = 0 },
	ServiceDesk = { DisplayName = "Service Desk", Core = true, Order = 3, Price = 0, Bonus = 0 },
	CustomerLounge = { DisplayName = "Customer Lounge", Core = true, Order = 4, Price = 0, Bonus = 0 },
	VanGarage = { DisplayName = "Van Upgrade Garage", Core = true, Order = 5, Price = 0, Bonus = 0 },
	NeonSignage = {
		DisplayName = "Neon Signage",
		Icon = "💡",
		Order = 6,
		Price = 300,
		Bonus = 0.05,
		Description = "Neon trim on your entrance sign. +5% on every job.",
	},
	WashBayCanopy = {
		DisplayName = "Wash Bay Canopy",
		Icon = "⛱️",
		Order = 7,
		Price = 650,
		Bonus = 0.10,
		Description = "A covered, lit wash bay. +10% on every job.",
	},
	CoffeeKiosk = {
		DisplayName = "Coffee Kiosk",
		Icon = "☕",
		Order = 8,
		Price = 1100,
		Bonus = 0.15,
		Description = "Customers wait happier. +15% on every job.",
	},
}

local SIGN_FONTS = {
	"GothamBlack",
	"FredokaOne",
	"LuckiestGuy",
	"PermanentMarker",
	"Bangers",
	"Arcade",
	"Oswald",
	"SpecialElite",
}

local SIGN_COLOURS = {
	Navy = Color3.fromRGB(22, 44, 96),
	Royal = Color3.fromRGB(30, 110, 230),
	Teal = Color3.fromRGB(0, 170, 170),
	Lime = Color3.fromRGB(120, 210, 40),
	Gold = Color3.fromRGB(255, 190, 30),
	Orange = Color3.fromRGB(255, 120, 30),
	Red = Color3.fromRGB(220, 40, 50),
	Pink = Color3.fromRGB(255, 90, 170),
	Purple = Color3.fromRGB(130, 70, 210),
	White = Color3.fromRGB(255, 255, 255),
	Silver = Color3.fromRGB(190, 196, 204),
	Black = Color3.fromRGB(20, 20, 24),
}

local STAGE = {
	DriveToStore = 1,
	CollectKit = 2,
	ReturnToPlot = 3,
	NameCompany = 4,
	LaunchAdvert = 5,
	FirstJob = 6,
	Complete = 7,
}

local STAGE_INFO = {
	[1] = { Key = "DriveToStore", Title = "Road Trip", Objective = "Hop in your Caddy van and drive to the Hardware Supply Store." },
	[2] = { Key = "CollectKit", Title = "Shopping Run", Objective = "Step out and press the button to collect your free Starter Detailing Kit." },
	[3] = { Key = "ReturnToPlot", Title = "Heading Home", Objective = "Drive the van back to your plot." },
	[4] = { Key = "NameCompany", Title = "Open For Business", Objective = "Name your detailing company." },
	[5] = { Key = "LaunchAdvert", Title = "Marketing", Objective = "Open the Ads app on your phone and launch a £5 Leaflet Drop." },
	[6] = { Key = "FirstJob", Title = "First Customer", Objective = "Clean your first customer's car, then collect the payout at the desk." },
	[7] = { Key = "Complete", Title = "Tycoon", Objective = "Grow the business: buy equipment, run ads, upgrade the van." },
}

local STARTER_KIT = {
	Kit = { "Bucket", "Sponge", "Hose" },
	-- The kit ships with an entry-level washer and a bottle of snow foam so the
	-- first customer can actually be served. Everything else is bought.
	Tools = { "HighPressureWasher" },
	Chemicals = { "SnowFoam" },
	Loadout = { HighPressureWasher = "SnowFoam" },
}

local PROFILE_TEMPLATE = {
	SchemaVersion = 1,
	Cash = CONFIG.StartingCash,
	LifetimeEarnings = 0,
	JobsCompleted = 0,
	TutorialStep = STAGE.DriveToStore,
	CompanyName = "",
	OwnedKit = {},
	OwnedTools = {},
	OwnedChemicals = {},
	ChemicalLoadout = {},
	OwnedProps = {},
	PendingCustomers = 0,
	UnlockedStructures = {
		WashBay = true,
		PickUpBay = true,
		ServiceDesk = true,
		CustomerLounge = true,
		VanGarage = true,
	},
	Van = {
		Paint = { 242, 243, 243 }, -- classic Caddy white
		SignFont = "GothamBlack",
		SignTextColor = "Navy",
		SignStrokeColor = "White",
		Layout = {},
	},
}

-- Built-in R15 animations from Roblox's default Animate script.
local NPC_ANIMATIONS = {
	Walk = "rbxassetid://507777826",
	Idle = "rbxassetid://507766388",
}

local CAR_PAINTS = {
	Color3.fromRGB(196, 40, 28),
	Color3.fromRGB(13, 105, 172),
	Color3.fromRGB(39, 70, 45),
	Color3.fromRGB(27, 42, 53),
	Color3.fromRGB(163, 162, 165),
	Color3.fromRGB(245, 205, 48),
	Color3.fromRGB(91, 93, 105),
	Color3.fromRGB(110, 153, 202),
	Color3.fromRGB(124, 92, 70),
}

local NPC_SKIN_TONES = {
	Color3.fromRGB(255, 220, 190),
	Color3.fromRGB(234, 184, 146),
	Color3.fromRGB(198, 134, 96),
	Color3.fromRGB(141, 85, 54),
	Color3.fromRGB(92, 58, 38),
}

local NPC_OUTFITS = {
	Color3.fromRGB(52, 142, 64),
	Color3.fromRGB(33, 84, 185),
	Color3.fromRGB(196, 40, 28),
	Color3.fromRGB(245, 205, 48),
	Color3.fromRGB(107, 50, 124),
	Color3.fromRGB(17, 17, 17),
}

--------------------------------------------------------------------------------
-- GENERAL UTILITIES
--------------------------------------------------------------------------------

local function deepCopy(value)
	if type(value) ~= "table" then
		return value
	end
	local copy = {}
	for key, inner in value do
		copy[key] = deepCopy(inner)
	end
	return copy
end

-- Fill in anything the template has that the saved data lacks. Never removes keys.
local function reconcile(target, template)
	for key, templateValue in template do
		if target[key] == nil then
			target[key] = deepCopy(templateValue)
		elseif type(templateValue) == "table" and type(target[key]) == "table" and next(templateValue) ~= nil then
			-- Only recurse into dictionaries that define a shape; empty template
			-- tables are open-ended collections.
			if #templateValue == 0 then
				reconcile(target[key], templateValue)
			end
		end
	end
end

local function isFiniteNumber(value)
	return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end

local function isFiniteVector(value)
	return typeof(value) == "Vector3" and isFiniteNumber(value.X) and isFiniteNumber(value.Y) and isFiniteNumber(value.Z)
end

local function toInteger(value, minimum, maximum)
	if not isFiniteNumber(value) then
		return nil
	end
	local integer = math.floor(value + 0.5)
	if integer < minimum or integer > maximum then
		return nil
	end
	return integer
end

local function formatMoney(amount)
	local whole = tostring(math.floor(amount))
	local formatted = whole:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if formatted:sub(1, 1) == "," then
		formatted = formatted:sub(2)
	end
	return "£" .. formatted
end

local function arrayToSet(array)
	local set = {}
	for _, value in array do
		set[value] = true
	end
	return set
end

local SIGN_FONT_SET = arrayToSet(SIGN_FONTS)

local function pointInPart(point, part, padding)
	padding = padding or 0
	local relative = part.CFrame:PointToObjectSpace(point)
	local half = part.Size / 2
	return math.abs(relative.X) <= half.X + padding
		and math.abs(relative.Y) <= half.Y + padding
		and math.abs(relative.Z) <= half.Z + padding
end

local function randomFrom(array)
	return array[math.random(1, #array)]
end

local function shuffled(array)
	local copy = table.clone(array)
	for index = #copy, 2, -1 do
		local swap = math.random(1, index)
		copy[index], copy[swap] = copy[swap], copy[index]
	end
	return copy
end

local function sortedKeys(dictionary, orderField)
	local keys = {}
	for key in dictionary do
		table.insert(keys, key)
	end
	table.sort(keys, function(a, b)
		local orderA = dictionary[a][orderField] or 0
		local orderB = dictionary[b][orderField] or 0
		if orderA == orderB then
			return a < b
		end
		return orderA < orderB
	end)
	return keys
end

--------------------------------------------------------------------------------
-- PROFILE STORE  (a compact ProfileService-style wrapper)
--
-- · Session locking: a profile records which server holds it. Another server
--   waits for the lock to clear and only takes it over once the lock is stale
--   or it has run out of patience — the same trade-off ProfileService makes.
-- · Every write goes through UpdateAsync and first checks the lock is still
--   ours, so a server that has lost a profile can never overwrite it.
-- · Saves are queued per profile, never run concurrently, and are released
--   with a final write on leave and on shutdown.
-- · In Studio without API access (or in an unpublished place) it falls back
--   to an in-memory store that round-trips through JSON, so data that would
--   not survive a real DataStore fails here too.
--------------------------------------------------------------------------------

local MockDataStore = {}
MockDataStore.__index = MockDataStore

local mockBuckets = {}

local function roundTrip(value)
	if value == nil then
		return nil
	end
	return HttpService:JSONDecode(HttpService:JSONEncode(value))
end

function MockDataStore.new(name)
	mockBuckets[name] = mockBuckets[name] or {}
	return setmetatable({ _records = mockBuckets[name] }, MockDataStore)
end

function MockDataStore:GetAsync(key)
	task.wait(0.03)
	return roundTrip(self._records[key])
end

function MockDataStore:UpdateAsync(key, transform)
	task.wait(0.03)
	local nextValue = transform(roundTrip(self._records[key]))
	if nextValue ~= nil then
		self._records[key] = roundTrip(nextValue)
	end
	return roundTrip(self._records[key])
end

local SESSION_TAG = {
	game.PlaceId,
	if game.JobId ~= "" then game.JobId else "studio-" .. HttpService:GenerateGUID(false),
}

local function isOurSession(tag)
	return type(tag) == "table" and tag[1] == SESSION_TAG[1] and tag[2] == SESSION_TAG[2]
end

local Profile = {}
Profile.__index = Profile

local ProfileStore = {}
ProfileStore.__index = ProfileStore

function ProfileStore.new(name, template)
	local self = setmetatable({
		Name = name,
		Template = template,
		IsMock = false,
		_store = nil,
		_active = {},
	}, ProfileStore)

	local useMock = RunService:IsStudio() and game.PlaceId == 0
	if not useMock then
		local ok, store = pcall(function()
			return DataStoreService:GetDataStore(name)
		end)
		if ok and store then
			if RunService:IsStudio() then
				-- Studio only reaches DataStores with API access switched on.
				local probeOk = pcall(function()
					store:GetAsync("__access_probe")
				end)
				useMock = not probeOk
			end
			if not useMock then
				self._store = store
			end
		else
			useMock = true
		end
	end

	if useMock then
		self._store = MockDataStore.new(name)
		self.IsMock = true
		warn("[GameServer] DataStores unavailable here; using the in-memory profile store. "
			.. "Publish the place and enable Studio Access to API Services to persist data.")
	end
	return self
end

function ProfileStore:LoadProfileAsync(key, shouldKeepTrying)
	for attempt = 1, CONFIG.LoadAttempts do
		if shouldKeepTrying and not shouldKeepTrying() then
			return nil
		end

		local finalAttempt = attempt == CONFIG.LoadAttempts
		local outcome = "Error"
		local loadedRecord = nil

		local ok, err = pcall(function()
			self._store:UpdateAsync(key, function(record)
				if type(record) ~= "table" or type(record.Data) ~= "table" then
					record = {
						Data = deepCopy(self.Template),
						MetaData = { ProfileCreateTime = os.time(), SessionLoadCount = 0 },
					}
				end
				if type(record.MetaData) ~= "table" then
					record.MetaData = {}
				end

				local meta = record.MetaData
				local lockAge = os.time() - (tonumber(meta.LastUpdate) or 0)
				local heldElsewhere = meta.ActiveSession ~= nil and not isOurSession(meta.ActiveSession)
				if heldElsewhere and lockAge < CONFIG.SessionLockStale and not finalAttempt then
					outcome = "Locked"
					return nil -- leave the record untouched and retry
				end

				meta.ActiveSession = SESSION_TAG
				meta.LastUpdate = os.time()
				meta.SessionLoadCount = (tonumber(meta.SessionLoadCount) or 0) + 1
				outcome = "Loaded"
				loadedRecord = record
				return record
			end)
		end)

		if ok and outcome == "Loaded" and loadedRecord then
			local profile = setmetatable({
				Key = key,
				Data = loadedRecord.Data,
				MetaData = loadedRecord.MetaData,
				_store = self,
				_active = true,
				_releasing = false,
				_saving = false,
				_saveQueued = false,
				_lastPrioritySave = 0,
				_releaseListeners = {},
			}, Profile)
			self._active[profile] = true
			return profile
		elseif not ok then
			warn(("[GameServer] Profile load for %s failed (attempt %d): %s"):format(key, attempt, tostring(err)))
		end

		if not finalAttempt then
			task.wait(CONFIG.LoadRetryDelay)
		end
	end
	return nil
end

function ProfileStore:GetActiveProfiles()
	local list = {}
	for profile in self._active do
		table.insert(list, profile)
	end
	return list
end

function Profile:IsActive()
	return self._active
end

function Profile:Reconcile()
	reconcile(self.Data, self._store.Template)
end

function Profile:ListenToRelease(callback)
	table.insert(self._releaseListeners, callback)
end

function Profile:_fireRelease(reason)
	self._active = false
	self._store._active[self] = nil
	for _, callback in self._releaseListeners do
		task.spawn(callback, reason)
	end
end

-- One guarded UpdateAsync. Returns (succeeded, lockWasLost).
function Profile:_write(releasing)
	local lockLost = false
	local ok, err = pcall(function()
		self._store._store:UpdateAsync(self.Key, function(record)
			if type(record) ~= "table" then
				record = { MetaData = {} }
			end
			if type(record.MetaData) ~= "table" then
				record.MetaData = {}
			end
			if not isOurSession(record.MetaData.ActiveSession) then
				lockLost = true
				return nil
			end
			record.Data = self.Data
			record.MetaData.LastUpdate = os.time()
			record.MetaData.ActiveSession = if releasing then nil else SESSION_TAG
			return record
		end)
	end)
	if not ok then
		warn(("[GameServer] Save of %s failed: %s"):format(self.Key, tostring(err)))
	end
	return ok, lockLost
end

function Profile:Save()
	if not self._active or self._releasing then
		return
	end
	if self._saving then
		self._saveQueued = true
		return
	end
	self._saving = true
	repeat
		self._saveQueued = false
		local _, lockLost = self:_write(false)
		if lockLost then
			self._saving = false
			self:_fireRelease("Lost")
			return
		end
	until not self._saveQueued or not self._active
	self._saving = false
end

-- Save soon, but no more than once every PrioritySaveGap seconds.
function Profile:RequestSave()
	if not self._active or self._releasing then
		return
	end
	local now = os.clock()
	if now - self._lastPrioritySave < CONFIG.PrioritySaveGap then
		if not self._deferredSave then
			self._deferredSave = true
			task.delay(CONFIG.PrioritySaveGap - (now - self._lastPrioritySave), function()
				self._deferredSave = false
				self._lastPrioritySave = os.clock()
				self:Save()
			end)
		end
		return
	end
	self._lastPrioritySave = now
	task.spawn(self.Save, self)
end

function Profile:Release()
	if not self._active or self._releasing then
		return
	end
	self._releasing = true
	while self._saving do
		task.wait()
	end
	for _ = 1, 3 do
		local ok, lockLost = self:_write(true)
		if ok or lockLost then
			break
		end
		task.wait(1)
	end
	self:_fireRelease("Released")
end

local Profiles = ProfileStore.new(CONFIG.DataStoreName, PROFILE_TEMPLATE)

-- Repair anything in a loaded profile that is the wrong type. Saved data is
-- not trusted any more than the network is.
local function sanitizeData(data)
	local function number(key, fallback, minimum, maximum)
		local value = data[key]
		if not isFiniteNumber(value) then
			value = fallback
		end
		data[key] = math.clamp(value, minimum, maximum)
	end
	local function dictionary(key)
		if type(data[key]) ~= "table" then
			data[key] = {}
		end
	end

	number("Cash", CONFIG.StartingCash, 0, CONFIG.MaxCash)
	number("LifetimeEarnings", 0, 0, CONFIG.MaxCash)
	number("JobsCompleted", 0, 0, 1e9)
	number("TutorialStep", STAGE.DriveToStore, STAGE.DriveToStore, STAGE.Complete)
	number("PendingCustomers", 0, 0, CONFIG.MaxQueuedCustomers)
	data.TutorialStep = math.floor(data.TutorialStep)
	data.PendingCustomers = math.floor(data.PendingCustomers)
	if type(data.CompanyName) ~= "string" then
		data.CompanyName = ""
	end
	for _, key in { "OwnedKit", "OwnedTools", "OwnedChemicals", "ChemicalLoadout", "OwnedProps", "UnlockedStructures" } do
		dictionary(key)
	end
	for id in data.OwnedTools do
		if not TOOLS[id] then
			data.OwnedTools[id] = nil
		end
	end
	for id in data.OwnedChemicals do
		if not CHEMICALS[id] then
			data.OwnedChemicals[id] = nil
		end
	end
	for toolId, chemicalId in data.ChemicalLoadout do
		if not TOOLS[toolId] or not CHEMICALS[chemicalId] then
			data.ChemicalLoadout[toolId] = nil
		end
	end
	for id, count in data.OwnedProps do
		if not VAN_PROPS[id] or not isFiniteNumber(count) then
			data.OwnedProps[id] = nil
		else
			data.OwnedProps[id] = math.clamp(math.floor(count), 0, CONFIG.MaxPropsPerType)
		end
	end

	if type(data.Van) ~= "table" then
		data.Van = deepCopy(PROFILE_TEMPLATE.Van)
	end
	local van = data.Van
	if type(van.Paint) ~= "table" or #van.Paint ~= 3 then
		van.Paint = deepCopy(PROFILE_TEMPLATE.Van.Paint)
	end
	for index = 1, 3 do
		van.Paint[index] = toInteger(van.Paint[index], 0, 255) or 242
	end
	if not SIGN_FONT_SET[van.SignFont] then
		van.SignFont = PROFILE_TEMPLATE.Van.SignFont
	end
	if not SIGN_COLOURS[van.SignTextColor] then
		van.SignTextColor = PROFILE_TEMPLATE.Van.SignTextColor
	end
	if not SIGN_COLOURS[van.SignStrokeColor] then
		van.SignStrokeColor = PROFILE_TEMPLATE.Van.SignStrokeColor
	end
	if type(van.Layout) ~= "table" then
		van.Layout = {}
	end
end

--------------------------------------------------------------------------------
-- NETWORK
--------------------------------------------------------------------------------

local NetworkEvents = ReplicatedStorage:FindFirstChild("NetworkEvents")
if not NetworkEvents then
	NetworkEvents = Instance.new("Folder")
	NetworkEvents.Name = "NetworkEvents"
	NetworkEvents.Parent = ReplicatedStorage
end

local function ensureRemote(className, name)
	local remote = NetworkEvents:FindFirstChild(name)
	if remote and not remote:IsA(className) then
		warn(("[GameServer] NetworkEvents.%s is a %s, expected %s; replacing it."):format(name, remote.ClassName, className))
		remote:Destroy()
		remote = nil
	end
	if not remote then
		remote = Instance.new(className)
		remote.Name = name
		remote.Parent = NetworkEvents
	end
	return remote
end

local CleanCarEvent = ensureRemote("RemoteEvent", "CleanCarEvent")
local ClaimPaymentEvent = ensureRemote("RemoteEvent", "ClaimPaymentEvent")
local UpgradeVanEvent = ensureRemote("RemoteEvent", "UpgradeVanEvent")
local QuestEvent = ensureRemote("RemoteEvent", "QuestEvent")
local CommerceEvent = ensureRemote("RemoteEvent", "CommerceEvent")
local NotifyEvent = ensureRemote("RemoteEvent", "NotifyEvent")
local DataSyncEvent = ensureRemote("RemoteEvent", "DataSyncEvent")
local SnapshotFunction = ensureRemote("RemoteFunction", "SnapshotFunction")

--------------------------------------------------------------------------------
-- COLLISION GROUPS
--------------------------------------------------------------------------------

local GROUP_VAN_BODY = "DetailingVanBody"
local GROUP_VAN_WHEELS = "DetailingVanWheels"
local GROUP_FX = "DetailingFX"

for _, groupName in { GROUP_VAN_BODY, GROUP_VAN_WHEELS, GROUP_FX } do
	if not PhysicsService:IsCollisionGroupRegistered(groupName) then
		PhysicsService:RegisterCollisionGroup(groupName)
	end
end
-- A van's wheels overlap its own wheel arches; they must not fight each other.
PhysicsService:CollisionGroupSetCollidable(GROUP_VAN_BODY, GROUP_VAN_WHEELS, false)
-- Client-side coins and droplets bounce off the ground, not off vans or each other.
PhysicsService:CollisionGroupSetCollidable(GROUP_FX, GROUP_VAN_BODY, false)
PhysicsService:CollisionGroupSetCollidable(GROUP_FX, GROUP_VAN_WHEELS, false)
PhysicsService:CollisionGroupSetCollidable(GROUP_FX, GROUP_FX, false)

--------------------------------------------------------------------------------
-- WORLD BUILDING
--------------------------------------------------------------------------------

local PALETTE = {
	Asphalt = Color3.fromRGB(52, 54, 60),
	Line = Color3.fromRGB(245, 245, 235),
	Pavement = Color3.fromRGB(196, 196, 190),
	Yard = Color3.fromRGB(214, 212, 204),
	Grass = Color3.fromRGB(88, 160, 72),
	Hedge = Color3.fromRGB(52, 112, 50),
	Brand = Color3.fromRGB(0, 170, 255),
	Accent = Color3.fromRGB(255, 196, 0),
	Dark = Color3.fromRGB(32, 36, 44),
	Glass = Color3.fromRGB(160, 210, 240),
	Wall = Color3.fromRGB(236, 232, 224),
	Brick = Color3.fromRGB(170, 85, 66),
	Neon = Color3.fromRGB(0, 255, 140),
	Wood = Color3.fromRGB(150, 105, 70),
	Metal = Color3.fromRGB(150, 155, 162),
}

local function newPart(parent, props)
	local part = Instance.new(props.ClassName or "Part")
	part.Anchored = true
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Material = Enum.Material.SmoothPlastic
	for key, value in props do
		if key ~= "ClassName" then
			(part :: any)[key] = value
		end
	end
	part.Parent = parent
	return part
end

local function newMarker(parent, name, cframe)
	return newPart(parent, {
		Name = name,
		Size = Vector3.new(1, 1, 1),
		CFrame = cframe,
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
	})
end

local function newZone(parent, name, size, cframe)
	local zone = newMarker(parent, name, cframe)
	zone.Size = size
	return zone
end

local function weld(part, base)
	local constraint = Instance.new("WeldConstraint")
	constraint.Part0 = base
	constraint.Part1 = part
	constraint.Parent = part
	return constraint
end

local function addSurfaceText(part, face, text, options)
	options = options or {}
	local gui = Instance.new("SurfaceGui")
	gui.Name = "Sign_" .. face.Name
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = options.PixelsPerStud or 30
	gui.LightInfluence = 0
	gui.MaxDistance = 500
	gui.Parent = part

	local label = Instance.new("TextLabel")
	label.Name = "Text"
	label.AnchorPoint = Vector2.new(0.5, 0.5)
	label.Position = UDim2.fromScale(0.5, 0.5)
	label.Size = UDim2.fromScale(0.92, 0.8)
	label.BackgroundTransparency = 1
	label.Font = options.Font or Enum.Font.GothamBlack
	label.Text = text
	label.TextScaled = true
	label.TextColor3 = options.TextColor or Color3.new(1, 1, 1)
	label.Parent = gui

	local stroke = Instance.new("UIStroke")
	stroke.Thickness = options.StrokeThickness or 3
	stroke.Color = options.StrokeColor or PALETTE.Dark
	stroke.Parent = label
	return label
end

-- Vertical cylinder (Roblox cylinders run along X, so turn it onto Y).
local function verticalCylinder(parent, props, centre)
	props.Shape = Enum.PartType.Cylinder
	props.CFrame = CFrame.new(centre) * CFrame.Angles(0, 0, math.rad(90))
	return newPart(parent, props)
end

-- Ground ---------------------------------------------------------------------

local GROUND_Y = 0
do
	local baseplate = Workspace:FindFirstChild("Baseplate")
	if baseplate and baseplate:IsA("BasePart") then
		GROUND_Y = baseplate.Position.Y + baseplate.Size.Y / 2
	end
end
local SURFACE_Y = GROUND_Y + 0.1
local PLOT_FRONT_Z = 24

do
	local stale = Workspace:FindFirstChild("CarDetailingTycoon")
	if stale then
		stale:Destroy()
	end
end

local World = Instance.new("Folder")
World.Name = "CarDetailingTycoon"

local Environment = Instance.new("Folder")
Environment.Name = "Environment"
Environment.Parent = World

local PlotsFolder = Instance.new("Folder")
PlotsFolder.Name = "Plots"
PlotsFolder.Parent = World

local VansFolder = Instance.new("Folder")
VansFolder.Name = "Vans"
VansFolder.Parent = World

local JobsFolder = Instance.new("Folder")
JobsFolder.Name = "CustomerCars"
JobsFolder.Parent = World

local NpcFolder = Instance.new("Folder")
NpcFolder.Name = "Customers"
NpcFolder.Parent = World

if not Workspace:FindFirstChild("Baseplate") then
	newPart(Environment, {
		Name = "Ground",
		Size = Vector3.new(1600, 2, 1600),
		CFrame = CFrame.new(0, GROUND_Y - 1, 0),
		Color = PALETTE.Grass,
		Material = Enum.Material.Grass,
	})
end

-- Roads ----------------------------------------------------------------------

local ROAD_LENGTH = CONFIG.PlotCount * CONFIG.PlotSpacing + 320

newPart(Environment, {
	Name = "MainRoad",
	Size = Vector3.new(ROAD_LENGTH, 0.2, 36),
	CFrame = CFrame.new(0, GROUND_Y, 0),
	Color = PALETTE.Asphalt,
	Material = Enum.Material.Asphalt,
})
for _, sideZ in { -21, 21 } do
	newPart(Environment, {
		Name = "Pavement",
		Size = Vector3.new(ROAD_LENGTH, 0.2, 6),
		CFrame = CFrame.new(0, GROUND_Y + 0.05, sideZ),
		Color = PALETTE.Pavement,
		Material = Enum.Material.Concrete,
	})
end
for x = -ROAD_LENGTH / 2 + 8, ROAD_LENGTH / 2 - 8, 18 do
	newPart(Environment, {
		Name = "Dash",
		Size = Vector3.new(8, 0.05, 0.5),
		CFrame = CFrame.new(x, SURFACE_Y + 0.02, 0),
		Color = PALETTE.Line,
		CanCollide = false,
		CanQuery = false,
	})
end

newPart(Environment, {
	Name = "StoreRoad",
	Size = Vector3.new(30, 0.2, 122),
	CFrame = CFrame.new(0, GROUND_Y, -79),
	Color = PALETTE.Asphalt,
	Material = Enum.Material.Asphalt,
})

-- Trees and a skyline so the drive to the store reads as a town.
local function buildTree(position)
	newPart(Environment, {
		Name = "Trunk",
		Size = Vector3.new(1.4, 8, 1.4),
		CFrame = CFrame.new(position + Vector3.new(0, 4, 0)),
		Color = PALETTE.Wood,
		Material = Enum.Material.Wood,
	})
	newPart(Environment, {
		Name = "Leaves",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(8, 8, 8),
		CFrame = CFrame.new(position + Vector3.new(0, 10, 0)),
		Color = PALETTE.Hedge,
		Material = Enum.Material.Grass,
	})
end

for x = -ROAD_LENGTH / 2 + 30, ROAD_LENGTH / 2 - 30, 60 do
	if math.abs(x) > 30 then
		buildTree(Vector3.new(x, SURFACE_Y, -27))
	end
end

local skylineRandom = Random.new(42)
for _, x in { -420, -320, -230, -140, 140, 230, 320, 420 } do
	local height = skylineRandom:NextNumber(30, 90)
	local block = newPart(Environment, {
		Name = "Building",
		Size = Vector3.new(44, height, 36),
		CFrame = CFrame.new(x, SURFACE_Y + height / 2, -70),
		Color = Color3.fromHSV(skylineRandom:NextNumber(0, 1), 0.15, skylineRandom:NextNumber(0.6, 0.85)),
		Material = Enum.Material.Concrete,
	})
	for floorY = 6, height - 4, 8 do
		newPart(Environment, {
			Name = "Windows",
			Size = Vector3.new(40, 3, 0.3),
			CFrame = block.CFrame * CFrame.new(0, -height / 2 + floorY, 18.1),
			Color = PALETTE.Glass,
			Material = Enum.Material.Glass,
			Transparency = 0.2,
		})
	end
end

-- Hardware Supply Store -----------------------------------------------------

local Store = Instance.new("Model")
Store.Name = "HardwareStore"
Store.Parent = Environment

newPart(Store, {
	Name = "CarPark",
	Size = Vector3.new(100, 0.2, 52),
	CFrame = CFrame.new(0, GROUND_Y, -166),
	Color = PALETTE.Asphalt,
	Material = Enum.Material.Asphalt,
})
for x = -42, 42, 12 do
	newPart(Store, {
		Name = "BayLine",
		Size = Vector3.new(0.4, 0.05, 14),
		CFrame = CFrame.new(x, SURFACE_Y + 0.02, -182),
		Color = PALETTE.Line,
		CanCollide = false,
		CanQuery = false,
	})
end

local storeBody = newPart(Store, {
	Name = "Building",
	Size = Vector3.new(84, 24, 44),
	CFrame = CFrame.new(0, SURFACE_Y + 12, -216),
	Color = PALETTE.Wall,
	Material = Enum.Material.Concrete,
})
local fascia = newPart(Store, {
	Name = "Fascia",
	Size = Vector3.new(86, 6, 1),
	CFrame = CFrame.new(0, SURFACE_Y + 21, -193.6),
	Color = Color3.fromRGB(255, 120, 30),
})
addSurfaceText(fascia, Enum.NormalId.Back, "HARDWARE SUPPLY STORE", { StrokeColor = Color3.fromRGB(120, 50, 0) })
newPart(Store, {
	Name = "Entrance",
	Size = Vector3.new(18, 11, 0.4),
	CFrame = CFrame.new(0, SURFACE_Y + 5.5, -193.9),
	Color = PALETTE.Glass,
	Material = Enum.Material.Glass,
	Transparency = 0.3,
})
for _, x in { -28, 28 } do
	newPart(Store, {
		Name = "ShopWindow",
		Size = Vector3.new(24, 8, 0.4),
		CFrame = CFrame.new(x, SURFACE_Y + 7, -193.9),
		Color = PALETTE.Glass,
		Material = Enum.Material.Glass,
		Transparency = 0.3,
	})
end
newPart(Store, {
	Name = "Roof",
	Size = Vector3.new(88, 1, 48),
	CFrame = storeBody.CFrame * CFrame.new(0, 12.5, 0),
	Color = PALETTE.Dark,
})

local StoreZone = newZone(Store, "StoreZone", Vector3.new(100, 16, 52), CFrame.new(0, SURFACE_Y + 8, -166))

verticalCylinder(Store, {
	Name = "KitPedestal",
	Size = Vector3.new(3, 4, 4),
	Color = PALETTE.Dark,
	Material = Enum.Material.Metal,
}, Vector3.new(24, SURFACE_Y + 1.5, -188))
local KitButton = verticalCylinder(Store, {
	Name = "KitButton",
	Size = Vector3.new(0.8, 2.8, 2.8),
	Color = Color3.fromRGB(255, 60, 60),
	Material = Enum.Material.Neon,
}, Vector3.new(24, SURFACE_Y + 3.4, -188))

local KitPrompt = Instance.new("ProximityPrompt")
KitPrompt.Name = "CollectKitPrompt"
KitPrompt.ActionText = "Collect Starter Kit"
KitPrompt.ObjectText = "Hardware Supply Store"
KitPrompt.HoldDuration = 0.4
KitPrompt.MaxActivationDistance = 10
KitPrompt.RequiresLineOfSight = false
KitPrompt.Parent = KitButton

do
	local board = Instance.new("BillboardGui")
	board.Name = "KitBillboard"
	board.Size = UDim2.fromScale(10, 2.5)
	board.StudsOffset = Vector3.new(0, 5, 0)
	board.MaxDistance = 140
	board.LightInfluence = 0
	board.Parent = KitButton
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.Text = "🧰 FREE STARTER KIT"
	label.TextScaled = true
	label.TextColor3 = PALETTE.Accent
	label.Parent = board
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 3
	stroke.Color = PALETTE.Dark
	stroke.Parent = label
end

-- Player spawn between the two middle plots; players are moved to their own
-- plot as soon as one is assigned.
if not Workspace:FindFirstChildWhichIsA("SpawnLocation", true) then
	newPart(Environment, {
		ClassName = "SpawnLocation",
		Name = "TycoonSpawn",
		Size = Vector3.new(10, 0.4, 10),
		CFrame = CFrame.new(0, SURFACE_Y + 0.2, 60),
		Color = PALETTE.Brand,
		Neutral = true,
		Duration = 0,
	})
end

-- Plots ----------------------------------------------------------------------

local Plots = {}

local function buildPlot(index, centreX)
	-- Plot-local frame: origin on the front edge, +Z runs away from the road.
	local origin = CFrame.new(centreX, SURFACE_Y, PLOT_FRONT_Z)
	local function at(x, y, z)
		return origin * CFrame.new(x, y, z)
	end
	local facingIn = CFrame.Angles(0, math.pi, 0) -- turn a default (-Z) facing to +Z
	local facingRoad = CFrame.new()

	local model = Instance.new("Model")
	model.Name = "Plot_" .. index
	model:SetAttribute("PlotId", index)
	model:SetAttribute("OwnerUserId", 0)

	newPart(model, {
		Name = "Lawn",
		Size = Vector3.new(110, 0.2, 124),
		CFrame = at(0, -0.1, 62),
		Color = PALETTE.Grass,
		Material = Enum.Material.Grass,
	})
	newPart(model, {
		Name = "Yard",
		Size = Vector3.new(100, 0.2, 100),
		CFrame = at(0, -0.07, 51),
		Color = PALETTE.Yard,
		Material = Enum.Material.Concrete,
	})

	-- Hedges on every side except the gate, so vehicles use the entrance.
	local hedge = { Color = PALETTE.Hedge, Material = Enum.Material.Grass }
	for _, spec in {
		{ Vector3.new(39, 3, 1.4), at(-35.5, 1.5, 0.7) },
		{ Vector3.new(39, 3, 1.4), at(35.5, 1.5, 0.7) },
		{ Vector3.new(1.4, 3, 124), at(-54.3, 1.5, 62) },
		{ Vector3.new(1.4, 3, 124), at(54.3, 1.5, 62) },
		{ Vector3.new(110, 3, 1.4), at(0, 1.5, 123.3) },
	} do
		newPart(model, { Name = "Hedge", Size = spec[1], CFrame = spec[2], Color = hedge.Color, Material = hedge.Material })
	end

	-- Entrance sign
	for _, x in { -15, 15 } do
		newPart(model, {
			Name = "GatePillar",
			Size = Vector3.new(3, 18, 3),
			CFrame = at(x, 9, 2.5),
			Color = PALETTE.Brick,
			Material = Enum.Material.Brick,
		})
	end
	local signBoard = newPart(model, {
		Name = "EntranceSign",
		Size = Vector3.new(34, 6, 1.2),
		CFrame = at(0, 14.5, 2.5),
		Color = PALETTE.Dark,
	})
	local signFront = addSurfaceText(signBoard, Enum.NormalId.Front, "PLOT AVAILABLE", { StrokeColor = PALETTE.Brand })
	local signBack = addSurfaceText(signBoard, Enum.NormalId.Back, "PLOT AVAILABLE", { StrokeColor = PALETTE.Brand })

	-- Wash bay
	newPart(model, {
		Name = "WashBay",
		Size = Vector3.new(22, 0.2, 30),
		CFrame = at(-26, -0.04, 52),
		Color = Color3.fromRGB(176, 186, 196),
		Material = Enum.Material.Concrete,
	})
	for _, x in { -36.7, -15.3 } do
		newPart(model, {
			Name = "BayStripe",
			Size = Vector3.new(0.6, 0.05, 30),
			CFrame = at(x, 0.08, 52),
			Color = PALETTE.Brand,
			CanCollide = false,
			CanQuery = false,
		})
	end
	newPart(model, {
		Name = "Drain",
		Size = Vector3.new(16, 0.05, 1),
		CFrame = at(-26, 0.08, 52),
		Color = PALETTE.Dark,
		Material = Enum.Material.DiamondPlate,
		CanCollide = false,
		CanQuery = false,
	})
	newPart(model, {
		Name = "WashStation",
		Size = Vector3.new(2.5, 4, 3),
		CFrame = at(-40, 2, 52),
		Color = PALETTE.Brand,
	})
	local washSign = newPart(model, { Name = "WashBaySign", Size = Vector3.new(10, 2.6, 0.4), CFrame = at(-41, 8, 36), Color = PALETTE.Dark })
	addSurfaceText(washSign, Enum.NormalId.Front, "WASH BAY", { StrokeColor = PALETTE.Brand })
	newPart(model, { Name = "SignPost", Size = Vector3.new(0.5, 7, 0.5), CFrame = at(-41, 3.5, 36), Color = PALETTE.Metal })

	-- Pick-up bay: glossy black glass with green neon edges
	newPart(model, {
		Name = "PickUpBay",
		Size = Vector3.new(22, 0.2, 26),
		CFrame = at(-26, -0.04, 92),
		Color = Color3.fromRGB(22, 24, 30),
		Material = Enum.Material.Glass,
		Reflectance = 0.35,
	})
	for _, x in { -37.2, -14.8 } do
		newPart(model, {
			Name = "PickUpNeon",
			Size = Vector3.new(0.4, 0.1, 26),
			CFrame = at(x, 0.1, 92),
			Color = PALETTE.Neon,
			Material = Enum.Material.Neon,
			CanCollide = false,
			CanQuery = false,
		})
	end
	local pickUpSign = newPart(model, { Name = "PickUpSign", Size = Vector3.new(10, 2.6, 0.4), CFrame = at(-41, 8, 79), Color = PALETTE.Dark })
	addSurfaceText(pickUpSign, Enum.NormalId.Front, "PICK-UP", { StrokeColor = PALETTE.Neon })
	newPart(model, { Name = "SignPost", Size = Vector3.new(0.5, 7, 0.5), CFrame = at(-41, 3.5, 79), Color = PALETTE.Metal })

	-- Customer service desk
	newPart(model, { Name = "DeskBody", Size = Vector3.new(3, 3.4, 14), CFrame = at(6, 1.7, 92), Color = PALETTE.Dark })
	newPart(model, {
		Name = "DeskTop",
		Size = Vector3.new(3.6, 0.3, 14.6),
		CFrame = at(6, 3.55, 92),
		Color = Color3.fromRGB(240, 240, 245),
		Material = Enum.Material.Marble,
	})
	newPart(model, { Name = "Till", Size = Vector3.new(1.4, 1, 1.6), CFrame = at(6, 4.2, 95), Color = PALETTE.Metal })
	for _, z in { 86, 98 } do
		newPart(model, { Name = "DeskPost", Size = Vector3.new(0.4, 6, 0.4), CFrame = at(6, 6.7, z), Color = PALETTE.Metal })
	end
	local deskSign = newPart(model, { Name = "DeskSign", Size = Vector3.new(0.5, 2.4, 13), CFrame = at(6, 10.4, 92), Color = PALETTE.Brand })
	addSurfaceText(deskSign, Enum.NormalId.Left, "CUSTOMER SERVICE")
	addSurfaceText(deskSign, Enum.NormalId.Right, "CUSTOMER SERVICE")

	-- Customer lounge
	newPart(model, { Name = "Lounge", Size = Vector3.new(26, 12, 22), CFrame = at(30, 6, 108), Color = PALETTE.Wall, Material = Enum.Material.Concrete })
	newPart(model, { Name = "LoungeRoof", Size = Vector3.new(28, 0.8, 24), CFrame = at(30, 12.4, 108), Color = PALETTE.Dark })
	newPart(model, {
		Name = "LoungeDoor",
		Size = Vector3.new(0.3, 7, 5),
		CFrame = at(16.9, 3.5, 108),
		Color = PALETTE.Glass,
		Material = Enum.Material.Glass,
		Transparency = 0.25,
	})
	newPart(model, {
		Name = "LoungeWindow",
		Size = Vector3.new(0.3, 4, 8),
		CFrame = at(16.9, 6, 115),
		Color = PALETTE.Glass,
		Material = Enum.Material.Glass,
		Transparency = 0.25,
	})
	local loungeSign = newPart(model, { Name = "LoungeSign", Size = Vector3.new(0.4, 2, 9), CFrame = at(16.6, 9.5, 108), Color = PALETTE.Dark })
	addSurfaceText(loungeSign, Enum.NormalId.Left, "CUSTOMER LOUNGE", { StrokeColor = PALETTE.Accent })

	-- Van upgrade garage (the customisation zone)
	newPart(model, {
		Name = "GaragePad",
		Size = Vector3.new(24, 0.2, 30),
		CFrame = at(34, -0.04, 44),
		Color = Color3.fromRGB(40, 42, 50),
		Material = Enum.Material.Concrete,
	})
	for _, spec in {
		{ Vector3.new(24, 0.1, 0.5), at(34, 0.1, 29.25) },
		{ Vector3.new(24, 0.1, 0.5), at(34, 0.1, 58.75) },
		{ Vector3.new(0.5, 0.1, 30), at(22.25, 0.1, 44) },
		{ Vector3.new(0.5, 0.1, 30), at(45.75, 0.1, 44) },
	} do
		newPart(model, {
			Name = "GarageNeon",
			Size = spec[1],
			CFrame = spec[2],
			Color = PALETTE.Accent,
			Material = Enum.Material.Neon,
			CanCollide = false,
			CanQuery = false,
		})
	end
	for _, corner in { { 21.4, 28.4 }, { 46.6, 28.4 }, { 21.4, 59.6 }, { 46.6, 59.6 } } do
		newPart(model, { Name = "GaragePillar", Size = Vector3.new(1.2, 14, 1.2), CFrame = at(corner[1], 7, corner[2]), Color = PALETTE.Metal })
	end
	local garageRoof = newPart(model, { Name = "GarageRoof", Size = Vector3.new(26, 0.8, 32), CFrame = at(34, 14.4, 44), Color = PALETTE.Dark })
	local garageLight = Instance.new("SpotLight")
	garageLight.Face = Enum.NormalId.Bottom
	garageLight.Range = 24
	garageLight.Angle = 120
	garageLight.Brightness = 2
	garageLight.Parent = garageRoof
	local garageSign = newPart(model, { Name = "GarageSign", Size = Vector3.new(26, 3, 0.6), CFrame = at(34, 12.5, 28.4), Color = PALETTE.Accent })
	addSurfaceText(garageSign, Enum.NormalId.Front, "VAN UPGRADES", { TextColor = PALETTE.Dark, StrokeColor = Color3.new(1, 1, 1) })

	-- Markers the systems navigate by
	local markers = Instance.new("Folder")
	markers.Name = "Markers"
	markers.Parent = model
	local carY = RIDE.CarRootHeight
	local plot = {
		Id = index,
		Model = model,
		Origin = origin,
		Owner = nil,
		SignLabels = { signFront, signBack },
		SignBoard = signBoard,
		Zone = newZone(model, "PlotZone", Vector3.new(110, 30, 124), at(0, 15, 62)),
		CustomiseZone = newZone(model, "CustomiseZone", Vector3.new(22, 12, 28), at(34, 6, 44)),
		VanSpawn = newMarker(markers, "VanSpawn", at(12, RIDE.VanChassisHeight + 0.4, 22) * facingRoad),
		CharacterSpawn = newMarker(markers, "CharacterSpawn", at(20, 3.5, 14)),
		CarSpawn = newMarker(markers, "CarSpawn", CFrame.lookAt(at(-70, carY, -15).Position, at(-60, carY, -15).Position)),
		BayApproach = newMarker(markers, "BayApproach", at(-26, carY, 22) * facingIn),
		WashBayPoint = newMarker(markers, "WashBayPoint", at(-26, carY, 52) * facingIn),
		PickUpPoint = newMarker(markers, "PickUpPoint", at(-26, carY, 92) * facingIn),
		PickUpExit = newMarker(markers, "PickUpExit", at(-26, carY, 112) * facingIn),
		CarExit = newMarker(markers, "CarExit", CFrame.lookAt(at(70, carY, -33).Position, at(80, carY, -33).Position)),
		DeskPoint = newMarker(markers, "DeskPoint", at(1.5, 0, 92)),
		PayoutAnchor = newMarker(markers, "PayoutAnchor", at(6, 7, 92)),
		LoungeDoor = newMarker(markers, "LoungeDoorPoint", at(13.5, 0, 108)),
		StructuresFolder = Instance.new("Folder"),
	}
	plot.StructuresFolder.Name = "Structures"
	plot.StructuresFolder.Parent = model

	-- Fallback vehicle routes in plot space, used if pathfinding cannot find one.
	plot.ArrivalFallback = {
		at(-20, carY, -15).Position,
		at(0, carY, -6).Position,
		at(0, carY, 10).Position,
		plot.BayApproach.Position,
	}
	plot.ExitFallback = {
		at(-47, carY, 112).Position,
		at(-47, carY, 14).Position,
		at(-4, carY, 8).Position,
		at(0, carY, -12).Position,
		at(20, carY, -33).Position,
		plot.CarExit.Position,
	}

	model.Parent = PlotsFolder
	return plot
end

for index = 1, CONFIG.PlotCount do
	local centreX = (index - (CONFIG.PlotCount + 1) / 2) * CONFIG.PlotSpacing
	Plots[index] = buildPlot(index, centreX)
end

-- Purchasable structures ------------------------------------------------------

local STRUCTURE_BUILDERS = {}

STRUCTURE_BUILDERS.NeonSignage = function(plot, folder)
	local board = plot.SignBoard
	for _, spec in {
		{ Vector3.new(35, 0.4, 0.4), CFrame.new(0, 3.2, -0.7) },
		{ Vector3.new(35, 0.4, 0.4), CFrame.new(0, -3.2, -0.7) },
		{ Vector3.new(0.4, 6.8, 0.4), CFrame.new(-17.3, 0, -0.7) },
		{ Vector3.new(0.4, 6.8, 0.4), CFrame.new(17.3, 0, -0.7) },
	} do
		newPart(folder, {
			Name = "NeonTrim",
			Size = spec[1],
			CFrame = board.CFrame * spec[2],
			Color = PALETTE.Brand,
			Material = Enum.Material.Neon,
			CanCollide = false,
		})
	end
	local openSign = newPart(folder, {
		Name = "OpenSign",
		Size = Vector3.new(0.3, 2, 5),
		CFrame = plot.Origin * CFrame.new(16.7, 9.5, 101),
		Color = Color3.fromRGB(255, 40, 80),
		Material = Enum.Material.Neon,
	})
	addSurfaceText(openSign, Enum.NormalId.Left, "OPEN", { TextColor = Color3.new(1, 1, 1), StrokeColor = Color3.fromRGB(120, 0, 30) })
end

STRUCTURE_BUILDERS.WashBayCanopy = function(plot, folder)
	for _, corner in { { -37.5, 37 }, { -14.5, 37 }, { -37.5, 67 }, { -14.5, 67 } } do
		newPart(folder, {
			Name = "CanopyPillar",
			Size = Vector3.new(1, 15, 1),
			CFrame = plot.Origin * CFrame.new(corner[1], 7.5, corner[2]),
			Color = PALETTE.Metal,
			Material = Enum.Material.Metal,
		})
	end
	local roof = newPart(folder, {
		Name = "CanopyRoof",
		Size = Vector3.new(26, 0.6, 34),
		CFrame = plot.Origin * CFrame.new(-26, 15.3, 52),
		Color = PALETTE.Glass,
		Material = Enum.Material.Glass,
		Transparency = 0.35,
	})
	newPart(folder, {
		Name = "CanopyTrim",
		Size = Vector3.new(26.2, 0.3, 0.4),
		CFrame = roof.CFrame * CFrame.new(0, -0.4, -17),
		Color = PALETTE.Brand,
		Material = Enum.Material.Neon,
	})
	local light = Instance.new("SurfaceLight")
	light.Face = Enum.NormalId.Bottom
	light.Range = 18
	light.Brightness = 1.5
	light.Parent = roof
end

STRUCTURE_BUILDERS.CoffeeKiosk = function(plot, folder)
	local booth = newPart(folder, {
		Name = "Kiosk",
		Size = Vector3.new(8, 7, 6),
		CFrame = plot.Origin * CFrame.new(32, 3.5, 82),
		Color = Color3.fromRGB(110, 70, 45),
		Material = Enum.Material.WoodPlanks,
	})
	newPart(folder, {
		Name = "Awning",
		Size = Vector3.new(9, 0.4, 3),
		CFrame = booth.CFrame * CFrame.new(0, 3, -4) * CFrame.Angles(math.rad(-12), 0, 0),
		Color = Color3.fromRGB(230, 60, 60),
	})
	addSurfaceText(booth, Enum.NormalId.Front, "☕ COFFEE", { StrokeColor = Color3.fromRGB(60, 30, 10) })
	local steam = Instance.new("ParticleEmitter")
	steam.Texture = "rbxasset://textures/particles/smoke_main.dds"
	steam.Rate = 3
	steam.Lifetime = NumberRange.new(2, 3)
	steam.Speed = NumberRange.new(1, 2)
	steam.Size = NumberSequence.new(0.6, 2)
	steam.Transparency = NumberSequence.new(0.6, 1)
	steam.EmissionDirection = Enum.NormalId.Top
	steam.Parent = booth
end

local function rebuildStructures(plot, unlocked)
	plot.StructuresFolder:ClearAllChildren()
	if not unlocked then
		return
	end
	for id, isUnlocked in unlocked do
		local builder = STRUCTURE_BUILDERS[id]
		if isUnlocked and builder then
			local folder = Instance.new("Folder")
			folder.Name = id
			folder.Parent = plot.StructuresFolder
			builder(plot, folder)
		end
	end
end

local function setPlotSign(plot, text)
	for _, label in plot.SignLabels do
		label.Text = text
	end
end

World.Parent = Workspace

--------------------------------------------------------------------------------
-- THE CADDY VAN  (physics-driven: motor hinges on all four wheels, servo
-- steering on the front pair; the driver's client simulates it)
--------------------------------------------------------------------------------

local VAN_SIGN_TAGLINE = "MOBILE VALETING  •  CAR DETAILING"

local function paintColor(rgb)
	return Color3.fromRGB(rgb[1], rgb[2], rgb[3])
end

local function createHinge(name, part0, part1, worldCFrame, actuator)
	local attachment0 = Instance.new("Attachment")
	attachment0.Name = name .. "A0"
	attachment0.CFrame = part0.CFrame:ToObjectSpace(worldCFrame)
	attachment0.Parent = part0
	local attachment1 = Instance.new("Attachment")
	attachment1.Name = name .. "A1"
	attachment1.CFrame = part1.CFrame:ToObjectSpace(worldCFrame)
	attachment1.Parent = part1
	local hinge = Instance.new("HingeConstraint")
	hinge.Name = name
	hinge.Attachment0 = attachment0
	hinge.Attachment1 = attachment1
	hinge.ActuatorType = actuator
	hinge.Parent = part0
	return hinge
end

local function buildSignWriting(part, face)
	local gui = Instance.new("SurfaceGui")
	gui.Name = "SignWriting_" .. face.Name
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 40
	gui.LightInfluence = 0.4
	gui.MaxDistance = 300
	gui.ClipsDescendants = true
	gui.Enabled = false
	gui.Parent = part

	local stripe = Instance.new("Frame")
	stripe.Name = "WrapStripe"
	stripe.AnchorPoint = Vector2.new(0.5, 0.5)
	stripe.Position = UDim2.fromScale(0.5, 0.82)
	stripe.Size = UDim2.fromScale(1.4, 0.2)
	stripe.Rotation = -4
	stripe.BorderSizePixel = 0
	stripe.Parent = gui
	local gradient = Instance.new("UIGradient")
	gradient.Transparency = NumberSequence.new({
		NumberSequenceKeypoint.new(0, 0.8),
		NumberSequenceKeypoint.new(0.35, 0),
		NumberSequenceKeypoint.new(1, 0),
	})
	gradient.Parent = stripe

	local accent = Instance.new("Frame")
	accent.Name = "WrapAccent"
	accent.AnchorPoint = Vector2.new(0.5, 0.5)
	accent.Position = UDim2.fromScale(0.5, 0.68)
	accent.Size = UDim2.fromScale(1.4, 0.04)
	accent.Rotation = -4
	accent.BorderSizePixel = 0
	accent.Parent = gui

	local name = Instance.new("TextLabel")
	name.Name = "CompanyName"
	name.AnchorPoint = Vector2.new(0.5, 0.5)
	name.Position = UDim2.fromScale(0.5, 0.34)
	name.Size = UDim2.fromScale(0.9, 0.42)
	name.BackgroundTransparency = 1
	name.TextScaled = true
	name.Parent = gui
	local nameStroke = Instance.new("UIStroke")
	nameStroke.Thickness = 3
	nameStroke.Parent = name

	local tagline = Instance.new("TextLabel")
	tagline.Name = "Tagline"
	tagline.AnchorPoint = Vector2.new(0.5, 0.5)
	tagline.Position = UDim2.fromScale(0.5, 0.6)
	tagline.Size = UDim2.fromScale(0.8, 0.12)
	tagline.BackgroundTransparency = 1
	tagline.Font = Enum.Font.GothamBold
	tagline.Text = VAN_SIGN_TAGLINE
	tagline.TextScaled = true
	tagline.Parent = gui
	return gui
end

local function applyVanSignWriting(van, companyName, vanData)
	local font = Enum.Font[vanData.SignFont]
	local textColor = SIGN_COLOURS[vanData.SignTextColor]
	local strokeColor = SIGN_COLOURS[vanData.SignStrokeColor]
	for _, gui in van.SignGuis do
		gui.Enabled = companyName ~= ""
		local name = gui:FindFirstChild("CompanyName")
		local tagline = gui:FindFirstChild("Tagline")
		name.Text = companyName
		name.Font = font
		name.TextColor3 = textColor
		name:FindFirstChildOfClass("UIStroke").Color = strokeColor
		tagline.TextColor3 = textColor
		gui:FindFirstChild("WrapStripe").BackgroundColor3 = textColor
		gui:FindFirstChild("WrapAccent").BackgroundColor3 = strokeColor
	end
end

local function applyVanPaint(van, rgb)
	local color = paintColor(rgb)
	for _, part in van.PaintParts do
		part.Color = color
	end
end

-- Interior props ------------------------------------------------------------

local CHEMICAL_BOTTLE_COLOURS = {
	Color3.fromRGB(235, 245, 255),
	Color3.fromRGB(255, 150, 90),
	Color3.fromRGB(140, 210, 255),
	Color3.fromRGB(150, 255, 230),
	Color3.fromRGB(255, 220, 80),
}

-- Each builder receives add(name, size, localCFrame, color, material?, shape?)
-- where the local frame sits on the cargo floor at the centre of the footprint.
local PROP_BUILDERS = {
	ChemicalRack = function(add, width, depth)
		local height = 3.1
		for _, sx in { -1, 1 } do
			for _, sz in { -1, 1 } do
				add("Post", Vector3.new(0.15, height, 0.15), CFrame.new(sx * (width / 2 - 0.1), height / 2, sz * (depth / 2 - 0.1)), PALETTE.Metal)
			end
		end
		for shelf = 0, 2 do
			local y = 0.15 + shelf * 1.05
			add("Shelf", Vector3.new(width - 0.1, 0.1, depth - 0.1), CFrame.new(0, y, 0), PALETTE.Metal, Enum.Material.DiamondPlate)
			local count = math.floor((depth - 0.3) / 0.5)
			for bottle = 1, count do
				local z = -depth / 2 + 0.35 + (bottle - 1) * 0.5
				add("Bottle", Vector3.new(0.7, 0.38, 0.38), CFrame.new(0, y + 0.4, z) * CFrame.Angles(0, 0, math.rad(90)),
					CHEMICAL_BOTTLE_COLOURS[(bottle + shelf) % #CHEMICAL_BOTTLE_COLOURS + 1], Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
			end
		end
	end,
	DrillBitOrganiser = function(add, width, depth)
		add("Case", Vector3.new(width - 0.4, 0.7, depth - 0.6), CFrame.new(0, 0.35, 0), Color3.fromRGB(255, 120, 30))
		add("Lid", Vector3.new(width - 0.4, 0.12, depth - 0.6), CFrame.new(0, 0.76, 0), Color3.fromRGB(40, 40, 46))
		for index = 1, 5 do
			add("Bit", Vector3.new(0.12, 0.5, 0.12), CFrame.new(-0.45 + index * 0.15, 1.05, 0), PALETTE.Metal, Enum.Material.Metal)
		end
	end,
	UtilityShelf = function(add, width, depth)
		local height = 3.3
		add("Back", Vector3.new(width - 0.1, height, 0.1), CFrame.new(0, height / 2, depth / 2 - 0.1), PALETTE.Dark)
		for shelf = 0, 2 do
			local y = 0.2 + shelf * 1.4
			add("Shelf", Vector3.new(width - 0.1, 0.12, depth - 0.2), CFrame.new(0, y, 0), PALETTE.Metal)
			add("Box", Vector3.new(0.9, 0.7, depth - 0.6), CFrame.new(-width / 4, y + 0.42, 0), Color3.fromRGB(200, 160, 90), Enum.Material.Cardboard)
			add("Box", Vector3.new(0.9, 0.5, depth - 0.6), CFrame.new(width / 4, y + 0.32, 0), Color3.fromRGB(60, 120, 200))
		end
	end,
	HoseReel = function(add, width, depth)
		add("Frame", Vector3.new(width - 0.4, 0.2, depth - 0.6), CFrame.new(0, 0.1, 0), PALETTE.Metal)
		add("Drum", Vector3.new(0.9, 1.5, 1.5), CFrame.new(0, 0.95, 0), Color3.fromRGB(230, 200, 40), Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
		add("Hose", Vector3.new(0.95, 1.2, 1.2), CFrame.new(0, 0.95, 0), Color3.fromRGB(40, 140, 60), Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
	end,
	WaterTank = function(add, width, depth)
		add("Tank", Vector3.new(width - 0.4, 2.2, depth - 0.5), CFrame.new(0, 1.1, 0), Color3.fromRGB(40, 120, 220))
		add("Cap", Vector3.new(0.3, 0.8, 0.8), CFrame.new(0, 2.35, 0) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(30, 30, 36), Enum.Material.SmoothPlastic, Enum.PartType.Cylinder)
		add("Gauge", Vector3.new(0.1, 1.6, 0.3), CFrame.new(width / 2 - 0.18, 1.1, 0), Color3.fromRGB(200, 240, 255), Enum.Material.Glass)
	end,
}

local function footprint(propId, rotated)
	local def = VAN_PROPS[propId]
	if rotated then
		return def.D, def.W
	end
	return def.W, def.D
end

local function rebuildVanLayout(van, layout)
	van.LayoutFolder:ClearAllChildren()
	local floor = van.CargoFloor
	for index, placement in layout do
		local builder = PROP_BUILDERS[placement.Id]
		if builder then
			local cols, rows = footprint(placement.Id, placement.R == 1)
			local centreX = -VAN_GRID.Cols * VAN_GRID.CellX / 2 + VAN_GRID.CellX * (placement.X - 1 + cols / 2)
			local centreZ = -VAN_GRID.Rows * VAN_GRID.CellZ / 2 + VAN_GRID.CellZ * (placement.Y - 1 + rows / 2)
			local origin = floor.CFrame * CFrame.new(centreX, floor.Size.Y / 2, centreZ - 0)
			local width = VAN_GRID.CellX * VAN_PROPS[placement.Id].W - 0.15
			local depth = VAN_GRID.CellZ * VAN_PROPS[placement.Id].D - 0.15
			if placement.R == 1 then
				origin = origin * CFrame.Angles(0, math.rad(90), 0)
			end
			local model = Instance.new("Model")
			model.Name = ("%d_%s"):format(index, placement.Id)
			local parts = {}
			builder(function(name, size, localCFrame, color, material, shape)
				local part = newPart(model, {
					Name = name,
					Size = size,
					CFrame = origin * localCFrame,
					Color = color,
					Material = material or Enum.Material.SmoothPlastic,
					CanCollide = false,
					CanQuery = false,
					CanTouch = false,
					Massless = true,
					CollisionGroup = GROUP_VAN_BODY,
				})
				if shape then
					part.Shape = shape
				end
				table.insert(parts, part)
			end, width, depth)
			model.Parent = van.LayoutFolder
			for _, part in parts do
				weld(part, floor)
				part.Anchored = false
			end
		end
	end
end

local function setVanNetworkOwner(van, player)
	for _, part in van.Model:GetDescendants() do
		if part:IsA("BasePart") and not part.Anchored then
			pcall(part.SetNetworkOwner, part, player)
		end
	end
end

local function buildVan(session)
	local plot = session.Plot
	local base = plot.VanSpawn.CFrame
	local vanData = session.Data.Van
	local paint = paintColor(vanData.Paint)

	local model = Instance.new("Model")
	model.Name = "Van_" .. session.Player.UserId
	model:SetAttribute("OwnerUserId", session.Player.UserId)
	model:SetAttribute("MaxSpeed", 55)
	model:SetAttribute("ReverseSpeed", 20)
	model:SetAttribute("MaxSteerAngle", 32)
	model:SetAttribute("WheelRadius", 1.5)
	-- Sign conventions for the client controller; it re-checks them while
	-- driving and flips either one if the van moves the wrong way.
	model:SetAttribute("WheelForwardSign", -1)
	model:SetAttribute("SteerSign", -1)

	local van = { Model = model, PaintParts = {}, SignGuis = {} }

	local chassis = newPart(model, {
		Name = "Chassis",
		Size = Vector3.new(4.6, 1, 15.5),
		CFrame = base,
		Color = PALETTE.Dark,
		CustomPhysicalProperties = PhysicalProperties.new(4, 0.3, 0, 1, 1),
		CollisionGroup = GROUP_VAN_BODY,
	})
	model.PrimaryPart = chassis
	van.Chassis = chassis

	local function body(name, size, localCFrame, props)
		props = props or {}
		local part = newPart(model, {
			Name = name,
			Size = size,
			CFrame = base * localCFrame,
			Color = props.Color or paint,
			Material = props.Material or Enum.Material.SmoothPlastic,
			Transparency = props.Transparency or 0,
			Massless = true,
			CollisionGroup = GROUP_VAN_BODY,
		})
		if props.CanQuery == false then
			part.CanQuery = false
		end
		if props.Shape then
			part.Shape = props.Shape
		end
		if props.Paint then
			part:SetAttribute("Paintable", true)
			table.insert(van.PaintParts, part)
		end
		weld(part, chassis)
		return part
	end
	local glass = { Color = PALETTE.Glass, Material = Enum.Material.Glass, Transparency = 0.45, CanQuery = false }
	local trim = { Color = PALETTE.Dark }

	body("Sill", Vector3.new(7, 1.4, 16), CFrame.new(0, -0.1, 0), { Paint = true })
	van.CargoFloor = body("CargoFloor", Vector3.new(6.4, 0.3, 9.6), CFrame.new(0, 0.75, 2.9), { Color = Color3.fromRGB(70, 72, 78), Material = Enum.Material.DiamondPlate })
	local leftWall = body("LeftWall", Vector3.new(0.3, 3.5, 9.8), CFrame.new(-3.35, 2.65, 2.9), { Paint = true })
	local rightWall = body("RightWall", Vector3.new(0.3, 3.5, 9.8), CFrame.new(3.35, 2.65, 2.9), { Paint = true })
	body("Roof", Vector3.new(7, 0.3, 13.4), CFrame.new(0, 4.55, 1.3), { Paint = true })
	local rearDoor = body("RearDoor", Vector3.new(6.4, 1.9, 0.3), CFrame.new(0, 1.85, 7.85), { Paint = true })
	body("RearGlass", Vector3.new(6.4, 1.6, 0.25), CFrame.new(0, 3.6, 7.85), glass)
	body("Bulkhead", Vector3.new(6.4, 3.5, 0.2), CFrame.new(0, 2.65, -1.95), trim)
	body("CabFloor", Vector3.new(6.4, 0.3, 4.9), CFrame.new(0, 0.75, -4.4), { Color = Color3.fromRGB(40, 40, 46) })
	for _, side in { -1, 1 } do
		body("CabSide", Vector3.new(0.3, 1.7, 5.6), CFrame.new(side * 3.35, 1.75, -4.75), { Paint = true })
		body("CabGlass", Vector3.new(0.25, 1.8, 3.45), CFrame.new(side * 3.35, 3.5, -3.675), glass)
		body("APillar", Vector3.new(0.3, 0.3, 2.3), CFrame.lookAt(Vector3.new(side * 3.35, 3.5, -6.1), Vector3.new(side * 3.35, 5.3, -4.7)), { Paint = true })
		body("Mirror", Vector3.new(0.9, 0.6, 0.3), CFrame.new(side * 3.9, 3.0, -5.3), trim)
		body("DoorSeam", Vector3.new(0.05, 3.3, 0.08), CFrame.new(side * 3.51, 2.6, -1.95), trim)
		body("Headlight", Vector3.new(1.3, 0.55, 0.1), CFrame.new(side * 2.5, 1.95, -8.05), { Color = Color3.fromRGB(255, 250, 220), Material = Enum.Material.Neon })
		body("TailLight", Vector3.new(0.35, 1.3, 0.12), CFrame.new(side * 3.25, 2.4, 8.02), { Color = Color3.fromRGB(255, 30, 30), Material = Enum.Material.Neon })
		for _, wheelZ in { -5.6, 5.0 } do
			body("WheelArch", Vector3.new(0.1, 1.6, 3.6), CFrame.new(side * 3.52, 0.25, wheelZ), trim)
		end
	end
	body("Windscreen", Vector3.new(6.6, 0.2, 2.28), CFrame.lookAt(Vector3.new(0, 3.5, -6.1), Vector3.new(0, 5.3, -4.7)), glass)
	body("Nose", Vector3.new(7, 2, 1.2), CFrame.new(0, 1.6, -7.4), { Paint = true })
	body("Grille", Vector3.new(3.2, 0.7, 0.1), CFrame.new(0, 1.3, -8.05), trim)
	body("Badge", Vector3.new(0.1, 0.8, 0.8), CFrame.new(0, 1.3, -8.12) * CFrame.Angles(0, math.rad(90), 0), { Color = PALETTE.Metal, Shape = Enum.PartType.Cylinder })
	body("FrontBumper", Vector3.new(7.3, 0.7, 0.5), CFrame.new(0, -0.35, -8.15), trim)
	body("RearBumper", Vector3.new(7.3, 0.7, 0.5), CFrame.new(0, -0.35, 8.15), trim)
	body("Dashboard", Vector3.new(6.4, 0.7, 0.9), CFrame.new(0, 2.6, -6.3), trim)
	body("SteeringWheel", Vector3.new(0.15, 1.3, 1.3), CFrame.new(1.55, 3.05, -5.6) * CFrame.Angles(0, math.rad(90), 0), { Color = PALETTE.Dark, Shape = Enum.PartType.Cylinder })
	body("DriverBack", Vector3.new(2.2, 2.2, 0.4), CFrame.new(1.55, 2.5, -2.45), trim)
	body("PassengerBack", Vector3.new(2.2, 2.2, 0.4), CFrame.new(-1.55, 2.5, -2.45), trim)

	local seat = Instance.new("VehicleSeat")
	seat.Name = "DriverSeat"
	seat.Size = Vector3.new(2.2, 0.6, 2.2)
	seat.CFrame = base * CFrame.new(1.55, 1.2, -3.7) -- right-hand drive
	seat.Color = PALETTE.Dark
	seat.Material = Enum.Material.Fabric
	seat.Anchored = true
	seat.Massless = true
	seat.HeadsUpDisplay = false
	seat.MaxSpeed = 0
	seat.Torque = 0
	seat.TurnSpeed = 0
	seat.CollisionGroup = GROUP_VAN_BODY
	seat:SetAttribute("IsDetailingVan", true)
	seat.Parent = model
	weld(seat, chassis)
	van.Seat = seat

	local passengerSeat = Instance.new("Seat")
	passengerSeat.Name = "PassengerSeat"
	passengerSeat.Size = Vector3.new(2.2, 0.6, 2.2)
	passengerSeat.CFrame = base * CFrame.new(-1.55, 1.2, -3.7)
	passengerSeat.Color = PALETTE.Dark
	passengerSeat.Material = Enum.Material.Fabric
	passengerSeat.Anchored = true
	passengerSeat.Massless = true
	passengerSeat.CollisionGroup = GROUP_VAN_BODY
	passengerSeat.Parent = model
	weld(passengerSeat, chassis)

	table.insert(van.SignGuis, buildSignWriting(leftWall, Enum.NormalId.Left))
	table.insert(van.SignGuis, buildSignWriting(rightWall, Enum.NormalId.Right))
	table.insert(van.SignGuis, buildSignWriting(rearDoor, Enum.NormalId.Back))

	-- Grid attachments on the cargo floor: the interior layout snaps to these.
	for col = 1, VAN_GRID.Cols do
		for row = 1, VAN_GRID.Rows do
			local attachment = Instance.new("Attachment")
			attachment.Name = ("Grid_%d_%d"):format(col, row)
			attachment.Position = Vector3.new(
				-VAN_GRID.Cols * VAN_GRID.CellX / 2 + VAN_GRID.CellX * (col - 0.5),
				0.15,
				-VAN_GRID.Rows * VAN_GRID.CellZ / 2 + VAN_GRID.CellZ * (row - 0.5)
			)
			attachment.Parent = van.CargoFloor
		end
	end
	van.LayoutFolder = Instance.new("Folder")
	van.LayoutFolder.Name = "InteriorLayout"
	van.LayoutFolder.Parent = model

	-- Wheels
	local wheelProps = PhysicalProperties.new(1.2, 1.6, 0, 100, 1)
	for _, side in { -1, 1 } do
		for _, wheelZ in { -5.6, 5.0 } do
			local front = wheelZ < 0
			local centre = base * CFrame.new(side * 3.25, -0.6, wheelZ)
			local wheel = newPart(model, {
				Name = (if front then "Front" else "Rear") .. (if side < 0 then "Left" else "Right") .. "Wheel",
				Shape = Enum.PartType.Cylinder,
				Size = Vector3.new(1.1, 3, 3),
				CFrame = centre,
				Color = Color3.fromRGB(25, 25, 28),
				CustomPhysicalProperties = wheelProps,
				CollisionGroup = GROUP_VAN_WHEELS,
			})
			local hub = newPart(model, {
				Name = "Hub",
				Shape = Enum.PartType.Cylinder,
				Size = Vector3.new(1.16, 1.7, 1.7),
				CFrame = centre,
				Color = PALETTE.Metal,
				Material = Enum.Material.Metal,
				CanCollide = false,
				CanQuery = false,
				Massless = true,
				CollisionGroup = GROUP_VAN_WHEELS,
			})
			weld(hub, wheel)

			local axleHolder = chassis
			if front then
				local knuckle = newPart(model, {
					Name = "Knuckle",
					Size = Vector3.new(0.6, 0.6, 0.6),
					CFrame = centre,
					Transparency = 1,
					CanCollide = false,
					CanQuery = false,
					CustomPhysicalProperties = PhysicalProperties.new(0.7, 0.3, 0, 1, 1),
					CollisionGroup = GROUP_VAN_WHEELS,
				})
				local steer = createHinge("Steer", chassis, knuckle, centre * CFrame.Angles(0, 0, math.rad(90)), Enum.ActuatorType.Servo)
				steer.ServoMaxTorque = 60000
				steer.AngularSpeed = 6
				steer.LimitsEnabled = true
				steer.LowerAngle = -40
				steer.UpperAngle = 40
				steer:SetAttribute("SteerServo", true)
				axleHolder = knuckle
			end
			local motor = createHinge("Axle", axleHolder, wheel, centre, Enum.ActuatorType.Motor)
			motor.MotorMaxTorque = 9000
			motor.AngularVelocity = 0
			motor:SetAttribute("DriveMotor", true)
		end
	end

	applyVanSignWriting(van, session.CompanyDisplayName or "", vanData)
	rebuildVanLayout(van, vanData.Layout)

	model.Parent = VansFolder
	for _, part in model:GetDescendants() do
		if part:IsA("BasePart") then
			part.Anchored = false
		end
	end
	setVanNetworkOwner(van, nil)

	-- Only the owner may drive. The server hands physics to the driver so the
	-- van responds instantly, and takes it back the moment they get out.
	seat:GetPropertyChangedSignal("Occupant"):Connect(function()
		local humanoid = seat.Occupant
		if humanoid then
			local occupant = Players:GetPlayerFromCharacter(humanoid.Parent)
			if occupant ~= session.Player then
				local seatWeld = seat:FindFirstChild("SeatWeld")
				if seatWeld then
					seatWeld:Destroy()
				end
				humanoid.Sit = false
				return
			end
			setVanNetworkOwner(van, occupant)
		else
			setVanNetworkOwner(van, nil)
		end
	end)

	return van
end

--------------------------------------------------------------------------------
-- CUSTOMER CARS AND THE DIRT ENGINE
--------------------------------------------------------------------------------

local CUSTOMER_NAMES = { "Dave", "Priya", "Tom", "Aisha", "Gareth", "Chloe", "Mo", "Sophie", "Raj", "Ellie", "Callum", "Zara", "Bex", "Kofi" }

-- Candidate positions for each layer, in the car's local frame (front is -Z).
local DIRT_SLOTS = {
	HeavyMud = {
		{ Vector3.new(0.12, 0.7, 2.2), CFrame.new(-3.01, 0.55, -1.4) },
		{ Vector3.new(0.12, 0.7, 2.2), CFrame.new(-3.01, 0.55, 1.2) },
		{ Vector3.new(0.12, 0.7, 2.2), CFrame.new(3.01, 0.55, -1.4) },
		{ Vector3.new(0.12, 0.7, 2.2), CFrame.new(3.01, 0.55, 1.2) },
		{ Vector3.new(0.12, 0.3, 2.4), CFrame.new(-3.01, 1.45, -4.1) },
		{ Vector3.new(0.12, 0.3, 2.4), CFrame.new(-3.01, 1.45, 4.1) },
		{ Vector3.new(0.12, 0.3, 2.4), CFrame.new(3.01, 1.45, -4.1) },
		{ Vector3.new(0.12, 0.3, 2.4), CFrame.new(3.01, 1.45, 4.1) },
		{ Vector3.new(4.2, 0.5, 0.12), CFrame.new(0, 0.45, -6.71) },
		{ Vector3.new(4.2, 0.5, 0.12), CFrame.new(0, 0.45, 6.71) },
		{ Vector3.new(2.2, 0.14, 1.4), CFrame.new(-1.3, 2.07, -5.2) },
		{ Vector3.new(2.2, 0.14, 1.4), CFrame.new(1.3, 2.07, -5.2) },
	},
	DeepScratches = {
		{ Vector3.new(0.06, 0.1, 2.4), CFrame.new(-2.98, 1.35, -1.6) * CFrame.Angles(math.rad(8), 0, 0) },
		{ Vector3.new(0.06, 0.1, 2.4), CFrame.new(-2.98, 1.3, 1.4) * CFrame.Angles(math.rad(-10), 0, 0) },
		{ Vector3.new(0.06, 0.1, 2.4), CFrame.new(2.98, 1.35, -1.6) * CFrame.Angles(math.rad(-8), 0, 0) },
		{ Vector3.new(0.06, 0.1, 2.4), CFrame.new(2.98, 1.3, 1.4) * CFrame.Angles(math.rad(10), 0, 0) },
		{ Vector3.new(0.12, 0.08, 2.6), CFrame.new(-0.6, 2.04, -4.2) * CFrame.Angles(0, math.rad(20), 0) },
		{ Vector3.new(0.12, 0.08, 2.6), CFrame.new(0.6, 2.04, -4.2) * CFrame.Angles(0, math.rad(-15), 0) },
		{ Vector3.new(0.12, 0.08, 2.0), CFrame.new(0.4, 2.04, 5.0) * CFrame.Angles(0, math.rad(70), 0) },
	},
	InteriorStains = {
		{ Vector3.new(1.0, 0.06, 0.9), CFrame.new(-1.3, 2.255, -0.8) },
		{ Vector3.new(1.0, 0.06, 0.9), CFrame.new(1.3, 2.255, -0.8) },
		{ Vector3.new(1.2, 0.06, 0.9), CFrame.new(-1.4, 2.255, 2.3) },
		{ Vector3.new(1.2, 0.06, 0.9), CFrame.new(1.4, 2.255, 2.3) },
		{ Vector3.new(1.0, 0.8, 0.06), CFrame.new(-1.3, 3.0, 0.1) },
		{ Vector3.new(1.0, 0.8, 0.06), CFrame.new(1.3, 3.0, 0.1) },
	},
	ProtectiveSeal = {
		{ Vector3.new(2.4, 0.04, 2.0), CFrame.new(-1.25, 3.98, 0.9) },
		{ Vector3.new(2.4, 0.04, 2.0), CFrame.new(1.25, 3.98, 0.9) },
		{ Vector3.new(2.6, 0.04, 1.6), CFrame.new(0, 2.02, -3.3) },
		{ Vector3.new(2.6, 0.04, 1.6), CFrame.new(0, 2.02, 5.0) },
	},
}

local DIRT_LOOK = {
	HeavyMud = { Material = Enum.Material.Mud, Colors = { Color3.fromRGB(102, 72, 44), Color3.fromRGB(86, 62, 40), Color3.fromRGB(120, 88, 56) } },
	DeepScratches = { Material = Enum.Material.SmoothPlastic, Colors = { Color3.fromRGB(214, 218, 224), Color3.fromRGB(230, 232, 236) } },
	InteriorStains = { Material = Enum.Material.Fabric, Colors = { Color3.fromRGB(86, 58, 34), Color3.fromRGB(70, 50, 30), Color3.fromRGB(110, 90, 40) } },
	ProtectiveSeal = { Material = Enum.Material.SmoothPlastic, Colors = { Color3.fromRGB(206, 210, 214) } },
}

local function buildCustomerCar(jobId, layers, spawnCFrame)
	local paint = randomFrom(CAR_PAINTS)
	local model = Instance.new("Model")
	model.Name = "CustomerCar_" .. jobId:sub(1, 8)

	local root = newPart(model, {
		Name = "Root",
		Size = Vector3.new(5.6, 0.5, 12),
		CFrame = spawnCFrame,
		Transparency = 1,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
	})
	model.PrimaryPart = root
	local paintParts = {}

	local function piece(name, size, localCFrame, props)
		props = props or {}
		local part = newPart(model, {
			Name = name,
			Size = size,
			CFrame = spawnCFrame * localCFrame,
			Color = props.Color or paint,
			Material = props.Material or Enum.Material.SmoothPlastic,
			Transparency = props.Transparency or 0,
			Reflectance = props.Reflectance or 0,
			CanTouch = false,
			Massless = true,
		})
		if props.CanQuery == false then
			part.CanQuery = false
		end
		if props.Shape then
			part.Shape = props.Shape
		end
		if props.Paint then
			table.insert(paintParts, part)
		end
		weld(part, root)
		part.Anchored = false
		return part
	end
	local glass = { Color = PALETTE.Glass, Material = Enum.Material.Glass, Transparency = 0.55, CanQuery = false }
	local fabric = { Color = Color3.fromRGB(55, 55, 62), Material = Enum.Material.Fabric }
	local dark = { Color = PALETTE.Dark }

	piece("Body", Vector3.new(5.9, 1.6, 12.6), CFrame.new(0, 0.95, 0), { Paint = true, Reflectance = 0.05 })
	piece("Bonnet", Vector3.new(5.7, 0.25, 3.8), CFrame.new(0, 1.875, -4.3), { Paint = true, Reflectance = 0.05 })
	piece("Boot", Vector3.new(5.7, 0.25, 2.4), CFrame.new(0, 1.875, 5.0), { Paint = true, Reflectance = 0.05 })
	local roof = piece("Roof", Vector3.new(5.4, 0.22, 4.6), CFrame.new(0, 3.85, 0.9), { Paint = true, Reflectance = 0.05 })
	piece("Windscreen", Vector3.new(5.3, 0.15, 2.05), CFrame.lookAt(Vector3.new(0, 2.85, -1.9), Vector3.new(0, 4.64, -0.9)), glass)
	piece("RearWindow", Vector3.new(5.3, 0.15, 1.9), CFrame.lookAt(Vector3.new(0, 2.85, 3.5), Vector3.new(0, 1.06, 4.1)), glass)
	for _, side in { -1, 1 } do
		piece("SideGlass", Vector3.new(0.12, 1.75, 5.6), CFrame.new(side * 2.68, 2.85, 0.7), glass)
		piece("BPillar", Vector3.new(0.22, 1.9, 0.3), CFrame.new(side * 2.7, 2.85, 0.9), { Paint = true })
		piece("FrontSeat", Vector3.new(2.1, 0.45, 1.7), CFrame.new(side * 1.3, 2.0, -0.7), fabric)
		piece("SeatBack", Vector3.new(2.1, 1.5, 0.35), CFrame.new(side * 1.3, 2.95, 0.3), fabric)
		piece("Headlight", Vector3.new(1.2, 0.4, 0.1), CFrame.new(side * 2.0, 1.4, -6.33), { Color = Color3.fromRGB(255, 250, 220), Material = Enum.Material.Neon })
		piece("TailLight", Vector3.new(1.0, 0.4, 0.1), CFrame.new(side * 2.1, 1.45, 6.33), { Color = Color3.fromRGB(255, 30, 30), Material = Enum.Material.Neon })
		for _, wheelZ in { -4.1, 4.1 } do
			piece("Wheel", Vector3.new(1, 2.6, 2.6), CFrame.new(side * 2.6, 0, wheelZ), { Color = Color3.fromRGB(25, 25, 28), Shape = Enum.PartType.Cylinder })
		end
	end
	piece("RearBench", Vector3.new(5.0, 0.45, 1.6), CFrame.new(0, 2.0, 2.4), fabric)
	piece("RearBenchBack", Vector3.new(5.0, 1.4, 0.35), CFrame.new(0, 2.9, 3.35), fabric)
	piece("Dashboard", Vector3.new(5.3, 0.5, 0.7), CFrame.new(0, 2.2, -2.05), dark)
	piece("FrontBumper", Vector3.new(6.0, 0.55, 0.4), CFrame.new(0, 0.45, -6.45), dark)
	piece("RearBumper", Vector3.new(6.0, 0.55, 0.4), CFrame.new(0, 0.45, 6.45), dark)
	piece("Grille", Vector3.new(2.8, 0.45, 0.06), CFrame.new(0, 1.1, -6.33), dark)
	local plate = piece("NumberPlate", Vector3.new(1.9, 0.42, 0.05), CFrame.new(0, 0.95, 6.68), { Color = Color3.fromRGB(255, 205, 40) })
	local letters = "ABCDEFGHJKLMNOPRSTUVWXY"
	local function letter()
		local index = math.random(1, #letters)
		return letters:sub(index, index)
	end
	addSurfaceText(plate, Enum.NormalId.Back, ("%s%s%02d %s%s%s"):format(letter(), letter(), math.random(10, 74), letter(), letter(), letter()), {
		Font = Enum.Font.GothamBold,
		TextColor = Color3.fromRGB(15, 15, 15),
		StrokeThickness = 0,
		PixelsPerStud = 60,
	})

	-- Dirt segments
	local dirt = {}
	local counts = {}
	for _, layerId in layers do
		local layer = DIRT_LAYERS[layerId]
		local look = DIRT_LOOK[layerId]
		local slots = shuffled(DIRT_SLOTS[layerId])
		local count = math.min(#slots, math.random(layer.Segments[1], layer.Segments[2]))
		counts[layerId] = count
		for index = 1, count do
			local slot = slots[index]
			local part = newPart(model, {
				Name = ("Dirt_%s_%d"):format(layerId, index),
				Size = slot[1],
				CFrame = spawnCFrame * slot[2],
				Color = randomFrom(look.Colors),
				Material = look.Material,
				CanCollide = false,
				CanTouch = false,
				Massless = true,
			})
			part:SetAttribute("DirtLayer", layerId)
			part:SetAttribute("HitsRemaining", CONFIG.HitsPerSegment)
			weld(part, root)
			part.Anchored = false
			dirt[part] = layerId
		end
	end

	-- Lets pathfinding treat the car as see-through so its own body never
	-- blocks the route it is about to drive.
	local modifier = Instance.new("PathfindingModifier")
	modifier.PassThrough = true
	modifier.Parent = model

	return model, root, roof, paintParts, dirt, counts
end

-- Vehicle movement -----------------------------------------------------------

local function computeVehicleRoute(fromPosition, toPosition)
	local path = PathfindingService:CreatePath({
		AgentRadius = 4,
		AgentHeight = 6,
		AgentCanJump = false,
		AgentCanClimb = false,
		WaypointSpacing = 8,
	})
	local ok = pcall(function()
		path:ComputeAsync(fromPosition, toPosition)
	end)
	if not ok or path.Status ~= Enum.PathStatus.Success then
		return nil
	end
	local points = {}
	for _, waypoint in path:GetWaypoints() do
		local last = points[#points]
		if not last or (waypoint.Position - last).Magnitude > 3 then
			table.insert(points, waypoint.Position)
		end
	end
	return points
end

-- Drives an anchored-root model along points at a fixed ride height, easing
-- its heading round corners. Returns false if the job was cancelled en route.
local function driveAlong(job, points, speed)
	local root = job.Root
	local rideY = root.Position.Y
	local current = root.CFrame
	for _, point in points do
		local target = Vector3.new(point.X, rideY, point.Z)
		while true do
			if job.Cancelled or not root.Parent then
				return false
			end
			local dt = RunService.Heartbeat:Wait()
			local position = current.Position
			local offset = target - position
			local distance = offset.Magnitude
			if distance < 0.6 then
				break
			end
			local direction = offset.Unit
			local desired = CFrame.lookAt(position, position + direction)
			local turned = current.Rotation:Lerp(desired.Rotation, math.min(1, dt * 5))
			local step = math.min(distance, speed * dt)
			current = CFrame.new(position + direction * step) * turned
			root.CFrame = current
		end
	end
	return true
end

--------------------------------------------------------------------------------
-- DETAILING TOOLS  (real Tools in the Backpack, created only by the server)
--------------------------------------------------------------------------------

local IssuedTools = setmetatable({}, { __mode = "k" }) -- [Tool] = Player

local function buildTool(toolId)
	local def = TOOLS[toolId]
	local tool = Instance.new("Tool")
	tool.Name = def.DisplayName
	tool.ToolTip = def.Description
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.Grip = CFrame.new(0, -0.1, 0.5)
	tool:SetAttribute("ToolId", toolId)

	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.45, 0.9, 1.6)
	handle.Color = def.Color
	handle.Material = Enum.Material.SmoothPlastic
	handle.CanCollide = false
	handle.Massless = true
	handle.Parent = tool

	local function extra(name, size, offset, color, shape)
		local part = Instance.new("Part")
		part.Name = name
		part.Size = size
		part.CFrame = handle.CFrame * offset
		part.Color = color
		part.Material = Enum.Material.Metal
		part.CanCollide = false
		part.Massless = true
		if shape then
			part.Shape = shape
		end
		part.Parent = tool
		weld(part, handle)
	end

	local tipZ = -1.6
	if toolId == "HighPressureWasher" then
		extra("Lance", Vector3.new(0.16, 0.16, 2.2), CFrame.new(0, 0.25, -1.8), PALETTE.Metal)
		tipZ = -2.9
	elseif toolId == "RotaryPolisher" then
		extra("Pad", Vector3.new(0.35, 1.5, 1.5), CFrame.new(0, 0, -1.0) * CFrame.Angles(0, math.rad(90), 0), Color3.fromRGB(255, 255, 255), Enum.PartType.Cylinder)
		tipZ = -1.2
	elseif toolId == "SteamExtractor" then
		extra("Wand", Vector3.new(0.2, 0.2, 1.8), CFrame.new(0, 0.2, -1.6), PALETTE.Metal)
		extra("Head", Vector3.new(1.0, 0.25, 0.4), CFrame.new(0, 0.2, -2.6), PALETTE.Dark)
		tipZ = -2.8
	elseif toolId == "DrillBuffer" then
		extra("Chuck", Vector3.new(0.3, 0.3, 0.6), CFrame.new(0, 0.2, -1.1), PALETTE.Dark)
		extra("Buffer", Vector3.new(0.4, 1.1, 1.1), CFrame.new(0, 0.2, -1.55) * CFrame.Angles(0, math.rad(90), 0), Color3.fromRGB(255, 220, 120), Enum.PartType.Cylinder)
		tipZ = -1.8
	end

	local nozzle = Instance.new("Attachment")
	nozzle.Name = "Nozzle"
	nozzle.Position = Vector3.new(0, 0.2, tipZ)
	nozzle.Parent = handle
	return tool
end

local function issueTool(session, toolId)
	local player = session.Player
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack then
		return
	end
	for tool, owner in IssuedTools do
		if owner == player and tool:GetAttribute("ToolId") == toolId and tool.Parent then
			return -- already holds one
		end
	end
	local tool = buildTool(toolId)
	IssuedTools[tool] = player
	tool.Parent = backpack
end

local function issueAllTools(session)
	for tool, owner in IssuedTools do
		if owner == session.Player then
			IssuedTools[tool] = nil
			tool:Destroy()
		end
	end
	for _, toolId in sortedKeys(TOOLS, "Order") do
		if session.Data.OwnedTools[toolId] then
			issueTool(session, toolId)
		end
	end
end

--------------------------------------------------------------------------------
-- SESSIONS
--------------------------------------------------------------------------------

local Sessions = {} -- [Player] = session

local function getSession(player)
	local session = Sessions[player]
	if session and session.Ready then
		return session
	end
	return nil
end

local function rateLimit(session, key, perSecond, burst)
	local now = os.clock()
	local bucket = session.Buckets[key]
	if not bucket then
		bucket = { Tokens = burst, Last = now }
		session.Buckets[key] = bucket
	end
	bucket.Tokens = math.min(burst, bucket.Tokens + (now - bucket.Last) * perSecond)
	bucket.Last = now
	if bucket.Tokens < 1 then
		return false
	end
	bucket.Tokens -= 1
	return true
end

local function notify(session, text, kind)
	NotifyEvent:FireClient(session.Player, text, kind or "info")
end

local function payoutMultiplier(session)
	local bonus = 0
	for id, unlocked in session.Data.UnlockedStructures do
		local def = PLOT_STRUCTURES[id]
		if unlocked and def then
			bonus += def.Bonus
		end
	end
	return 1 + bonus
end

local function buildSnapshot(session)
	local data = session.Data
	local job = session.Job
	return {
		Cash = data.Cash,
		LifetimeEarnings = data.LifetimeEarnings,
		JobsCompleted = data.JobsCompleted,
		TutorialStep = data.TutorialStep,
		Objective = STAGE_INFO[data.TutorialStep].Objective,
		StageTitle = STAGE_INFO[data.TutorialStep].Title,
		CompanyName = session.CompanyDisplayName or "",
		OwnedKit = data.OwnedKit,
		OwnedTools = data.OwnedTools,
		OwnedChemicals = data.OwnedChemicals,
		ChemicalLoadout = data.ChemicalLoadout,
		OwnedProps = data.OwnedProps,
		PendingCustomers = data.PendingCustomers,
		UnlockedStructures = data.UnlockedStructures,
		Van = data.Van,
		PlotId = session.Plot and session.Plot.Id or 0,
		PayoutMultiplier = payoutMultiplier(session),
		InCustomiseZone = session.InCustomiseZone == true,
		ActiveJob = if job then { Id = job.Id, Status = job.Status, Bill = job.Bill } else nil,
	}
end

local function requestSync(session)
	if session.SyncQueued then
		return
	end
	session.SyncQueued = true
	task.defer(function()
		session.SyncQueued = false
		if Sessions[session.Player] == session and session.Player.Parent then
			DataSyncEvent:FireClient(session.Player, buildSnapshot(session))
		end
	end)
end

local function setCash(session, amount)
	session.Data.Cash = math.clamp(math.floor(amount), 0, CONFIG.MaxCash)
	if session.CashValue then
		session.CashValue.Value = session.Data.Cash
	end
	requestSync(session)
end

local function trySpend(session, price)
	if not isFiniteNumber(price) or price < 0 then
		return false
	end
	if session.Data.Cash < price then
		return false
	end
	setCash(session, session.Data.Cash - price)
	return true
end

local function setStage(session, stage)
	if session.Data.TutorialStep == stage then
		return
	end
	session.Data.TutorialStep = stage
	QuestEvent:FireClient(session.Player, {
		Action = "Stage",
		Step = stage,
		Title = STAGE_INFO[stage].Title,
		Objective = STAGE_INFO[stage].Objective,
	})
	requestSync(session)
	session.Profile:RequestSave()
end

local function serverRayParams()
	local exclude = { VansFolder, NpcFolder }
	for _, other in Players:GetPlayers() do
		if other.Character then
			table.insert(exclude, other.Character)
		end
	end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = exclude
	params.IgnoreWater = true
	return params
end

local function characterParts(player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	local root = character and character:FindFirstChild("HumanoidRootPart")
	local head = character and character:FindFirstChild("Head")
	if not humanoid or humanoid.Health <= 0 or not root or not head then
		return nil
	end
	return character, humanoid, root, head
end

local function prerequisitesMet(session, toolId)
	for _, kitId in TOOLS[toolId].Requires do
		if not session.Data.OwnedKit[kitId] then
			return false, kitId
		end
	end
	return true, nil
end

--------------------------------------------------------------------------------
-- NPC CUSTOMERS
--------------------------------------------------------------------------------

local function createCustomerNpc(name, spawnPosition)
	local description = Instance.new("HumanoidDescription")
	local skin = randomFrom(NPC_SKIN_TONES)
	local outfit = randomFrom(NPC_OUTFITS)
	description.HeadColor = skin
	description.LeftArmColor = skin
	description.RightArmColor = skin
	description.TorsoColor = outfit
	description.LeftLegColor = Color3.fromRGB(40, 44, 60)
	description.RightLegColor = Color3.fromRGB(40, 44, 60)

	local ok, npc = pcall(function()
		return Players:CreateHumanoidModelFromDescriptionAsync(description, Enum.HumanoidRigType.R15)
	end)
	if not ok or not npc then
		-- A blocky stand-in that still walks with Humanoid:MoveTo.
		npc = Instance.new("Model")
		local rootPart = newPart(npc, { Name = "HumanoidRootPart", Size = Vector3.new(2, 2, 1), Transparency = 1, CFrame = CFrame.new(spawnPosition + Vector3.new(0, 3, 0)) })
		local torso = newPart(npc, { Name = "Torso", Size = Vector3.new(2, 2, 1), Color = outfit, CFrame = rootPart.CFrame })
		local head = newPart(npc, { Name = "Head", Size = Vector3.new(1.2, 1.2, 1.2), Color = skin, CFrame = rootPart.CFrame * CFrame.new(0, 1.6, 0) })
		for _, part in { torso, head } do
			weld(part, rootPart)
			part.Anchored = false
		end
		rootPart.Anchored = false
		local humanoid = Instance.new("Humanoid")
		humanoid.HipHeight = 2
		humanoid.Parent = npc
		npc.PrimaryPart = rootPart
	end

	npc.Name = "Customer_" .. name
	local humanoid = npc:FindFirstChildOfClass("Humanoid")
	humanoid.DisplayName = name
	humanoid.WalkSpeed = CONFIG.NpcWalkSpeed
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
	npc:PivotTo(CFrame.new(spawnPosition + Vector3.new(0, 3, 0)))
	npc.Parent = NpcFolder
	local rootPart = npc:FindFirstChild("HumanoidRootPart")
	if rootPart then
		pcall(rootPart.SetNetworkOwner, rootPart, nil)
	end

	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator")
	animator.Parent = humanoid
	local tracks = {}
	for key, id in NPC_ANIMATIONS do
		local animation = Instance.new("Animation")
		animation.AnimationId = id
		local loaded, track = pcall(animator.LoadAnimation, animator, animation)
		if loaded and track then
			track.Looped = true
			tracks[key] = track
		end
	end
	if tracks.Idle then
		tracks.Idle:Play()
	end
	humanoid.Running:Connect(function(speed)
		if speed > 0.5 then
			if tracks.Walk and not tracks.Walk.IsPlaying then
				tracks.Walk:Play(0.15)
			end
		elseif tracks.Walk and tracks.Walk.IsPlaying then
			tracks.Walk:Stop(0.2)
		end
	end)
	return npc
end

local function waitForMoveTo(humanoid, timeout)
	local finished, reached = false, false
	local connection = humanoid.MoveToFinished:Connect(function(didReach)
		finished = true
		reached = didReach
	end)
	local started = os.clock()
	while not finished and os.clock() - started < timeout do
		task.wait()
	end
	connection:Disconnect()
	return reached
end

-- Walks an NPC to a point with PathfindingService, re-planning when blocked.
local function walkNpc(npc, destination, isCancelled)
	local humanoid = npc:FindFirstChildOfClass("Humanoid")
	local rootPart = npc:FindFirstChild("HumanoidRootPart")
	if not humanoid or not rootPart then
		return false
	end
	for _ = 1, 3 do
		if isCancelled() then
			return false
		end
		local path = PathfindingService:CreatePath({ AgentRadius = 2, AgentHeight = 5, AgentCanJump = false, WaypointSpacing = 3 })
		local ok = pcall(function()
			path:ComputeAsync(rootPart.Position, destination)
		end)
		if ok and path.Status == Enum.PathStatus.Success then
			local blocked = false
			local blockedConnection = path.Blocked:Connect(function()
				blocked = true
			end)
			for index, waypoint in path:GetWaypoints() do
				if index > 1 then
					if isCancelled() or blocked then
						break
					end
					humanoid:MoveTo(waypoint.Position)
					if not waitForMoveTo(humanoid, 4) then
						blocked = true
						break
					end
				end
			end
			blockedConnection:Disconnect()
			if not blocked then
				return not isCancelled()
			end
		end
		task.wait(0.3)
	end
	humanoid:MoveTo(destination)
	waitForMoveTo(humanoid, 6)
	return not isCancelled()
end

--------------------------------------------------------------------------------
-- JOBS: arrival -> washing -> pick-up bay -> payout -> departure
--------------------------------------------------------------------------------

local tryStartNextCustomer -- forward declaration

local function setJobStatus(job, status)
	job.Status = status
	job.Model:SetAttribute("Status", status)
	requestSync(job.Session)
end

local function destroyJob(job)
	job.Cancelled = true
	if job.Npc then
		job.Npc:Destroy()
		job.Npc = nil
	end
	if job.Model then
		job.Model:Destroy()
	end
	if job.Session.Job == job then
		job.Session.Job = nil
	end
end

local function chooseLayers(session, isTutorial)
	if isTutorial then
		return { "HeavyMud" }
	end
	local layers = {}
	for _, layerId in sortedKeys(DIRT_LAYERS, "Order") do
		local layer = DIRT_LAYERS[layerId]
		local data = session.Data
		local serviceable = data.OwnedTools[layer.Tool] and data.OwnedChemicals[layer.Chemical] and prerequisitesMet(session, layer.Tool)
		-- Only send work the business can actually do; mud is always there.
		if layerId == "HeavyMud" or (serviceable and math.random() < 0.8) then
			table.insert(layers, layerId)
		end
	end
	return layers
end

local function runDeparture(job)
	local session = job.Session
	local plot = session.Plot
	local function cancelled()
		return job.Cancelled
	end
	if job.Npc then
		walkNpc(job.Npc, (job.Root.CFrame * CFrame.new(-4, 0, -1)).Position, cancelled)
		if job.Npc then
			job.Npc:Destroy()
			job.Npc = nil
		end
	end
	if job.Cancelled then
		return
	end
	setJobStatus(job, "Departing")
	local route = computeVehicleRoute(plot.PickUpExit.Position, plot.CarExit.Position)
	local points = { plot.PickUpExit.Position }
	for _, point in route or plot.ExitFallback do
		table.insert(points, point)
	end
	driveAlong(job, points, CONFIG.CustomerDriveSpeed)
	destroyJob(job)
	if Sessions[session.Player] == session then
		tryStartNextCustomer(session)
	end
end

local function runPickUp(job)
	local session = job.Session
	local plot = session.Plot
	task.wait(0.8)
	if not driveAlong(job, { plot.PickUpPoint.Position }, CONFIG.CustomerDriveSpeed * 0.6) then
		return
	end
	job.Root.CFrame = plot.PickUpPoint.CFrame
	setJobStatus(job, "CustomerWalking")

	job.Npc = createCustomerNpc(job.CustomerName, plot.LoungeDoor.Position)
	walkNpc(job.Npc, plot.DeskPoint.Position, function()
		return job.Cancelled
	end)
	if job.Cancelled then
		return
	end
	local npcRoot = job.Npc and job.Npc:FindFirstChild("HumanoidRootPart")
	if npcRoot then
		local facing = plot.PayoutAnchor.Position
		npcRoot.CFrame = CFrame.lookAt(npcRoot.Position, Vector3.new(facing.X, npcRoot.Position.Y, facing.Z))
	end

	setJobStatus(job, "AwaitingPayment")
	ClaimPaymentEvent:FireClient(session.Player, {
		Action = "Ready",
		JobId = job.Id,
		Amount = job.Bill,
		CustomerName = job.CustomerName,
	})
	notify(session, ("%s is at the desk. Collect %s!"):format(job.CustomerName, formatMoney(job.Bill)), "success")
end

local function completeWash(job)
	setJobStatus(job, "ToPickup")
	if job.Counts.ProtectiveSeal then
		-- The seal is on: the paint really does come up glossier.
		for _, part in job.PaintParts do
			if part.Parent then
				part.Reflectance = 0.25
			end
		end
	end
	notify(job.Session, "Spotless! The car is moving to the Pick-Up Bay.", "success")
	task.spawn(runPickUp, job)
end

local function runArrival(job)
	local plot = job.Session.Plot
	local route = computeVehicleRoute(job.Root.Position, plot.BayApproach.Position) or plot.ArrivalFallback
	local points = table.clone(route)
	table.insert(points, plot.BayApproach.Position)
	table.insert(points, plot.WashBayPoint.Position)
	if not driveAlong(job, points, CONFIG.CustomerDriveSpeed) then
		return
	end
	job.Root.CFrame = plot.WashBayPoint.CFrame
	setJobStatus(job, "Washing")
	notify(job.Session, ("%s's car is in the wash bay. Grab your tools!"):format(job.CustomerName), "info")
end

local function startJob(session)
	local plot = session.Plot
	local isTutorial = session.Data.TutorialStep == STAGE.FirstJob and session.Data.JobsCompleted == 0
	local jobId = HttpService:GenerateGUID(false)
	local layers = chooseLayers(session, isTutorial)
	local spawnCFrame = plot.CarSpawn.CFrame

	-- Plan the route before the car exists so its own body is not an obstacle.
	local model, root, roof, paintParts, dirt, counts = buildCustomerCar(jobId, layers, spawnCFrame)
	local job = {
		Id = jobId,
		Session = session,
		Model = model,
		Root = root,
		Roof = roof,
		PaintParts = paintParts,
		Dirt = {},
		Counts = counts,
		Remaining = 0,
		Total = 0,
		Bill = 0,
		Multiplier = payoutMultiplier(session),
		Status = "Arriving",
		Cancelled = false,
		CustomerName = randomFrom(CUSTOMER_NAMES),
	}
	for part, layerId in dirt do
		job.Dirt[part] = { Layer = layerId, Hits = CONFIG.HitsPerSegment }
		job.Remaining += 1
	end
	job.Total = job.Remaining

	model:SetAttribute("JobId", jobId)
	model:SetAttribute("OwnerUserId", session.Player.UserId)
	model:SetAttribute("CustomerName", job.CustomerName)
	model:SetAttribute("Status", "Arriving")
	model:SetAttribute("BillTotal", 0)
	model:SetAttribute("CleanPercent", 0)
	CollectionService:AddTag(model, "CustomerVehicle")
	model.Parent = JobsFolder
	session.Job = job
	requestSync(session)
	task.spawn(runArrival, job)
	return job
end

tryStartNextCustomer = function(session)
	if session.Job or session.SpawningCustomer or not session.Ready then
		return
	end
	if session.Data.TutorialStep < STAGE.FirstJob then
		return -- the tutorial lock: no customers until the company is launched
	end
	if session.Data.PendingCustomers <= 0 then
		-- Never leave a player stranded with no money and no work.
		if session.Data.Cash < ADVERTS.LeafletDrop.Price then
			session.Data.PendingCustomers = 1
			notify(session, "A neighbour recommended you! A free customer is on the way.", "success")
		else
			return
		end
	end
	session.SpawningCustomer = true
	task.delay(CONFIG.CustomerSpawnDelay, function()
		session.SpawningCustomer = false
		if Sessions[session.Player] ~= session or session.Job or session.Data.PendingCustomers <= 0 then
			return
		end
		session.Data.PendingCustomers -= 1
		startJob(session)
	end)
end

--------------------------------------------------------------------------------
-- COMPANY NAMES  (validated, then filtered for broadcast by TextService)
--------------------------------------------------------------------------------

local FALLBACK_COMPANY_NAME = "Car Detailing Co."

local function normaliseCompanyName(raw)
	if type(raw) ~= "string" or #raw > 120 or not utf8.len(raw) then
		return nil, "That name can't be used."
	end
	local collapsed = raw:gsub("%s+", " ")
	local trimmed = collapsed:match("^%s*(.-)%s*$") or ""
	local length = utf8.len(trimmed) or 0
	if length < 3 then
		return nil, "Use at least 3 characters."
	end
	if length > 24 then
		return nil, "Keep it to 24 characters or fewer."
	end
	if not trimmed:match("^[%w &'%.%-]+$") then
		return nil, "Use letters, numbers, spaces and & ' . - only."
	end
	if not trimmed:match("%a") then
		return nil, "Include at least one letter."
	end
	return trimmed, nil
end

-- Returns the broadcast-safe string, or nil if the filter could not be reached.
local function filterForBroadcast(text, userId)
	local ok, result = pcall(function()
		local filterResult = TextService:FilterStringAsync(text, userId, Enum.TextFilterContext.PublicChat)
		return filterResult:GetNonChatStringForBroadcastAsync()
	end)
	if ok and type(result) == "string" then
		return result
	end
	return nil
end

local function applyBranding(session)
	local name = session.CompanyDisplayName or ""
	if session.Plot then
		setPlotSign(session.Plot, if name ~= "" then name:upper() else (session.Player.DisplayName .. "'s Plot"):upper())
	end
	if session.Van then
		applyVanSignWriting(session.Van, name, session.Data.Van)
	end
end

-- Stored names are re-filtered on every join: filters change over time.
local function loadCompanyName(session)
	local stored = session.Data.CompanyName
	if stored == "" then
		session.CompanyDisplayName = ""
		return
	end
	local filtered = filterForBroadcast(stored, session.Player.UserId)
	session.CompanyDisplayName = if filtered == stored then stored else FALLBACK_COMPANY_NAME
end

local function handleCompanyName(session, raw)
	local player = session.Player
	local function reply(ok, message, name)
		QuestEvent:FireClient(player, { Action = "NameResult", Ok = ok, Message = message, Name = name })
	end
	if session.Data.TutorialStep ~= STAGE.NameCompany then
		return reply(false, "Your company is already registered.")
	end
	if session.NamingBusy then
		return
	end
	local name, problem = normaliseCompanyName(raw)
	if not name then
		return reply(false, problem)
	end

	session.NamingBusy = true
	local filtered = filterForBroadcast(name, player.UserId)
	session.NamingBusy = false
	if Sessions[player] ~= session or session.Data.TutorialStep ~= STAGE.NameCompany then
		return
	end
	if filtered == nil then
		return reply(false, "The name checker is busy. Try again in a moment.")
	end
	if filtered ~= name then
		return reply(false, "That name isn't allowed. Try another one.")
	end

	session.Data.CompanyName = name
	session.CompanyDisplayName = name
	applyBranding(session)
	reply(true, ("%s is open for business!"):format(name), name)
	setStage(session, STAGE.LaunchAdvert)
	QuestEvent:FireClient(player, { Action = "OpenPhone", App = "Ads" })
	session.Profile:RequestSave()
end

--------------------------------------------------------------------------------
-- PLOTS, VANS, CHARACTERS
--------------------------------------------------------------------------------

local function assignPlot(session)
	for _, plot in Plots do
		if not plot.Owner then
			plot.Owner = session.Player
			plot.Model:SetAttribute("OwnerUserId", session.Player.UserId)
			session.Plot = plot
			session.Player:SetAttribute("PlotId", plot.Id)
			rebuildStructures(plot, session.Data.UnlockedStructures)
			return plot
		end
	end
	return nil
end

local function releasePlot(session)
	local plot = session.Plot
	if not plot then
		return
	end
	plot.Owner = nil
	plot.Model:SetAttribute("OwnerUserId", 0)
	rebuildStructures(plot, nil)
	setPlotSign(plot, "PLOT AVAILABLE")
	session.Plot = nil
end

local function spawnVan(session)
	if session.Van and session.Van.Model then
		session.Van.Model:Destroy()
	end
	session.Van = buildVan(session)
	session.VanLastPos = nil
	session.VanLastCFrame = nil
	applyBranding(session)
end

local function onCharacterAdded(session, character)
	local root = character:WaitForChild("HumanoidRootPart", 10)
	if not root or Sessions[session.Player] ~= session then
		return
	end
	task.wait()
	if session.Plot and character.Parent then
		character:PivotTo(session.Plot.CharacterSpawn.CFrame)
	end
	session.Player:WaitForChild("Backpack", 10)
	issueAllTools(session)
end

local function grantStarterKit(session)
	local data = session.Data
	for _, kitId in STARTER_KIT.Kit do
		data.OwnedKit[kitId] = true
	end
	for _, toolId in STARTER_KIT.Tools do
		data.OwnedTools[toolId] = true
	end
	for _, chemicalId in STARTER_KIT.Chemicals do
		data.OwnedChemicals[chemicalId] = true
	end
	for toolId, chemicalId in STARTER_KIT.Loadout do
		if not data.ChemicalLoadout[toolId] then
			data.ChemicalLoadout[toolId] = chemicalId
		end
	end
end

-- Drop placements that are invalid, overlap, or exceed what is owned.
local function sanitizeLayout(data)
	local clean = {}
	local occupied = {}
	local placedCounts = {}
	for _, placement in data.Van.Layout do
		if type(placement) == "table" and type(placement.Id) == "string" and VAN_PROPS[placement.Id] then
			local x = toInteger(placement.X, 1, VAN_GRID.Cols)
			local y = toInteger(placement.Y, 1, VAN_GRID.Rows)
			local rotated = placement.R == 1
			local cols, rows = footprint(placement.Id, rotated)
			local owned = data.OwnedProps[placement.Id] or 0
			local placed = placedCounts[placement.Id] or 0
			if x and y and x + cols - 1 <= VAN_GRID.Cols and y + rows - 1 <= VAN_GRID.Rows and placed < owned then
				local free = true
				for cx = x, x + cols - 1 do
					for cy = y, y + rows - 1 do
						if occupied[cx .. ":" .. cy] then
							free = false
						end
					end
				end
				if free then
					for cx = x, x + cols - 1 do
						for cy = y, y + rows - 1 do
							occupied[cx .. ":" .. cy] = true
						end
					end
					placedCounts[placement.Id] = placed + 1
					table.insert(clean, { Id = placement.Id, X = x, Y = y, R = if rotated then 1 else 0 })
				end
			end
		end
	end
	data.Van.Layout = clean
end

--------------------------------------------------------------------------------
-- THE WORLD TICK: van sanity, quest zones, the customisation garage
--------------------------------------------------------------------------------

local function zeroVelocity(model)
	for _, part in model:GetDescendants() do
		if part:IsA("BasePart") then
			part.AssemblyLinearVelocity = Vector3.zero
			part.AssemblyAngularVelocity = Vector3.zero
		end
	end
end

local function updateSession(session, elapsed)
	local player = session.Player
	local van = session.Van
	if not van or not van.Model.Parent or not van.Chassis.Parent then
		spawnVan(session)
		return
	end

	local chassisPosition = van.Chassis.Position
	if chassisPosition.Y < GROUND_Y - 40 then
		spawnVan(session)
		notify(session, "Your van took a tumble. It's been towed back to your plot.", "info")
		return
	end

	-- The driver's client simulates the van, so it could teleport it. Movement
	-- faster than the van can physically drive is rolled back.
	if session.VanLastPos then
		local moved = (chassisPosition - session.VanLastPos).Magnitude
		if moved > CONFIG.VanMaxSpeed * 1.7 * elapsed + 6 then
			setVanNetworkOwner(van, nil)
			van.Model:PivotTo(session.VanLastCFrame)
			zeroVelocity(van.Model)
			task.delay(1, function()
				local occupant = van.Seat.Parent and van.Seat.Occupant
				if occupant and Players:GetPlayerFromCharacter(occupant.Parent) == player then
					setVanNetworkOwner(van, player)
				end
			end)
			return
		end
	end
	session.VanLastPos = chassisPosition
	session.VanLastCFrame = van.Chassis.CFrame

	local _, humanoid, root = characterParts(player)
	local driving = humanoid ~= nil and humanoid.SeatPart == van.Seat
	local stage = session.Data.TutorialStep

	if stage == STAGE.DriveToStore and driving and pointInPart(chassisPosition, StoreZone) then
		setStage(session, STAGE.CollectKit)
		notify(session, "You made it! Step out and press the button for your Starter Detailing Kit.", "success")
	elseif stage == STAGE.CollectKit and not pointInPart(chassisPosition, StoreZone) then
		session.OutsideStoreTime = (session.OutsideStoreTime or 0) + elapsed
		if session.OutsideStoreTime > 4 then
			session.OutsideStoreTime = 0
			setStage(session, STAGE.DriveToStore)
		end
	elseif stage == STAGE.ReturnToPlot and driving and pointInPart(chassisPosition, session.Plot.Zone) then
		setStage(session, STAGE.NameCompany)
		QuestEvent:FireClient(player, { Action = "OpenNaming" })
	end
	if stage ~= STAGE.CollectKit then
		session.OutsideStoreTime = 0
	end

	local inZone = stage >= STAGE.LaunchAdvert
		and pointInPart(chassisPosition, session.Plot.CustomiseZone)
		and root ~= nil
		and (root.Position - chassisPosition).Magnitude <= CONFIG.CustomiseRange
	inZone = inZone == true
	if inZone ~= (session.InCustomiseZone == true) then
		session.InCustomiseZone = inZone
		UpgradeVanEvent:FireClient(player, { Action = if inZone then "ZoneEntered" else "ZoneExited" })
		requestSync(session)
	end
end

local tickAccumulator = 0
RunService.Heartbeat:Connect(function(dt)
	tickAccumulator += dt
	if tickAccumulator < 0.25 then
		return
	end
	local elapsed = tickAccumulator
	tickAccumulator = 0
	for _, session in Sessions do
		if session.Ready then
			local ok, err = pcall(updateSession, session, elapsed)
			if not ok then
				warn("[GameServer] World tick error: " .. tostring(err))
			end
		end
	end
end)

--------------------------------------------------------------------------------
-- STARTER KIT PICK-UP
--------------------------------------------------------------------------------

KitPrompt.Triggered:Connect(function(player)
	local session = getSession(player)
	if not session or not rateLimit(session, "Kit", 1, 2) then
		return
	end
	local stage = session.Data.TutorialStep
	if stage < STAGE.CollectKit then
		return notify(session, "Drive your Caddy van to the store car park first.", "error")
	elseif stage > STAGE.CollectKit then
		return notify(session, "You've already collected your Starter Detailing Kit.", "info")
	end
	local _, humanoid, root = characterParts(player)
	if not humanoid or not root then
		return
	end
	if humanoid.SeatPart then
		return notify(session, "Step out of the van first.", "error")
	end
	if (root.Position - KitButton.Position).Magnitude > KitPrompt.MaxActivationDistance + 6 then
		return
	end
	if not pointInPart(session.Van.Chassis.Position, StoreZone) then
		return notify(session, "Park your van in the store car park so you can load the kit.", "error")
	end

	grantStarterKit(session)
	issueAllTools(session)
	setStage(session, STAGE.ReturnToPlot)
	local items = {}
	for _, kitId in STARTER_KIT.Kit do
		table.insert(items, { Name = KIT_ITEMS[kitId].DisplayName, Icon = KIT_ITEMS[kitId].Icon })
	end
	for _, toolId in STARTER_KIT.Tools do
		table.insert(items, { Name = TOOLS[toolId].DisplayName, Icon = TOOLS[toolId].Icon })
	end
	for _, chemicalId in STARTER_KIT.Chemicals do
		table.insert(items, { Name = CHEMICALS[chemicalId].DisplayName, Icon = CHEMICALS[chemicalId].Icon })
	end
	QuestEvent:FireClient(player, { Action = "KitCollected", Items = items })
	session.Profile:RequestSave()
end)

--------------------------------------------------------------------------------
-- REMOTE: QuestEvent
--------------------------------------------------------------------------------

QuestEvent.OnServerEvent:Connect(function(player, action, payload)
	local session = getSession(player)
	if not session or not rateLimit(session, "Quest", 1, 3) then
		return
	end
	if action == "SubmitCompanyName" then
		handleCompanyName(session, payload)
	end
end)

--------------------------------------------------------------------------------
-- REMOTE: CommerceEvent  (every price comes from the server catalogue)
--------------------------------------------------------------------------------

local function autoLoadChemical(session, chemicalId)
	for _, layer in DIRT_LAYERS do
		if layer.Chemical == chemicalId and session.Data.OwnedTools[layer.Tool] and not session.Data.ChemicalLoadout[layer.Tool] then
			session.Data.ChemicalLoadout[layer.Tool] = chemicalId
		end
	end
end

local COMMERCE = {}

function COMMERCE.BuyTool(session, id)
	local def = TOOLS[id]
	local data = session.Data
	if not def then
		return false, "Unknown tool."
	end
	if data.OwnedTools[id] then
		return false, "You already own that."
	end
	local met, missing = prerequisitesMet(session, id)
	if not met then
		return false, ("The %s needs a %s from the starter kit."):format(def.DisplayName, KIT_ITEMS[missing].DisplayName)
	end
	if not trySpend(session, def.Price) then
		return false, ("You need %s for the %s."):format(formatMoney(def.Price), def.DisplayName)
	end
	data.OwnedTools[id] = true
	for _, layer in DIRT_LAYERS do
		if layer.Tool == id and data.OwnedChemicals[layer.Chemical] and not data.ChemicalLoadout[id] then
			data.ChemicalLoadout[id] = layer.Chemical
		end
	end
	issueTool(session, id)
	return true, ("%s %s added to your toolbar."):format(def.Icon, def.DisplayName)
end

function COMMERCE.BuyChemical(session, id)
	local def = CHEMICALS[id]
	if not def then
		return false, "Unknown chemical."
	end
	if session.Data.OwnedChemicals[id] then
		return false, "You already own that."
	end
	if not trySpend(session, def.Price) then
		return false, ("You need %s for %s."):format(formatMoney(def.Price), def.DisplayName)
	end
	session.Data.OwnedChemicals[id] = true
	autoLoadChemical(session, id)
	return true, ("%s %s is on the shelf."):format(def.Icon, def.DisplayName)
end

function COMMERCE.BuyStructure(session, id)
	local def = PLOT_STRUCTURES[id]
	if not def or def.Core then
		return false, "That can't be bought."
	end
	if session.Data.UnlockedStructures[id] then
		return false, "Already built."
	end
	if not trySpend(session, def.Price) then
		return false, ("You need %s for the %s."):format(formatMoney(def.Price), def.DisplayName)
	end
	session.Data.UnlockedStructures[id] = true
	rebuildStructures(session.Plot, session.Data.UnlockedStructures)
	if session.Job then
		session.Job.Multiplier = payoutMultiplier(session)
	end
	return true, ("%s %s built! Jobs now pay %d%% more."):format(def.Icon, def.DisplayName, math.floor(def.Bonus * 100 + 0.5))
end

function COMMERCE.BuyAdvert(session, id)
	local def = ADVERTS[id]
	local data = session.Data
	if not def then
		return false, "Unknown campaign."
	end
	if data.PendingCustomers + def.Customers > CONFIG.MaxQueuedCustomers then
		return false, "Your diary is full. Serve some customers first."
	end
	if not trySpend(session, def.Price) then
		return false, ("You need %s for a %s."):format(formatMoney(def.Price), def.DisplayName)
	end
	data.PendingCustomers += def.Customers
	if data.TutorialStep == STAGE.LaunchAdvert then
		setStage(session, STAGE.FirstJob)
	end
	tryStartNextCustomer(session)
	local noun = if def.Customers == 1 then "customer is" else "customers are"
	return true, ("%s %s launched! %d %s on the way."):format(def.Icon, def.DisplayName, def.Customers, noun)
end

function COMMERCE.SetChemical(session, toolId, chemicalId)
	local data = session.Data
	if not TOOLS[toolId] or not data.OwnedTools[toolId] then
		return false, nil
	end
	if chemicalId == "" then
		data.ChemicalLoadout[toolId] = nil
		return true, nil
	end
	if type(chemicalId) ~= "string" or not CHEMICALS[chemicalId] or not data.OwnedChemicals[chemicalId] then
		return false, nil
	end
	data.ChemicalLoadout[toolId] = chemicalId
	return true, nil
end

CommerceEvent.OnServerEvent:Connect(function(player, action, id, extra)
	local session = getSession(player)
	if not session or not rateLimit(session, "Commerce", 4, 8) then
		return
	end
	if type(action) ~= "string" or type(id) ~= "string" or #id > 64 then
		return
	end
	local handler = COMMERCE[action]
	if not handler then
		return
	end
	local stage = session.Data.TutorialStep
	if action == "SetChemical" then
		if stage < STAGE.ReturnToPlot then
			return
		end
	elseif stage < STAGE.LaunchAdvert then
		CommerceEvent:FireClient(player, { Action = action, Id = id, Ok = false, Message = "Finish setting up your company first." })
		return
	end

	local ok, message = handler(session, id, extra)
	if ok then
		requestSync(session)
		if action ~= "SetChemical" then
			session.Profile:RequestSave()
		end
	end
	CommerceEvent:FireClient(player, { Action = action, Id = id, Ok = ok, Message = message })
	if message then
		notify(session, message, if ok then "success" else "error")
	end
end)

--------------------------------------------------------------------------------
-- REMOTE: UpgradeVanEvent
--------------------------------------------------------------------------------

local function layoutOccupancy(layout)
	local cells = {}
	for index, placement in layout do
		local cols, rows = footprint(placement.Id, placement.R == 1)
		for cx = placement.X, placement.X + cols - 1 do
			for cy = placement.Y, placement.Y + rows - 1 do
				cells[cx .. ":" .. cy] = index
			end
		end
	end
	return cells
end

local VAN_ACTIONS = {}

function VAN_ACTIONS.SignWriting(session, payload)
	local vanData = session.Data.Van
	local font, textColour, strokeColour = payload.Font, payload.TextColor, payload.StrokeColor
	if type(font) ~= "string" or not SIGN_FONT_SET[font] then
		return false, "Pick a font from the list."
	end
	if type(textColour) ~= "string" or not SIGN_COLOURS[textColour] or type(strokeColour) ~= "string" or not SIGN_COLOURS[strokeColour] then
		return false, "Pick colours from the palette."
	end
	if font == vanData.SignFont and textColour == vanData.SignTextColor and strokeColour == vanData.SignStrokeColor then
		return true, nil
	end
	if not trySpend(session, CONFIG.SignWritingPrice) then
		return false, ("Sign writing costs %s."):format(formatMoney(CONFIG.SignWritingPrice))
	end
	vanData.SignFont = font
	vanData.SignTextColor = textColour
	vanData.SignStrokeColor = strokeColour
	applyVanSignWriting(session.Van, session.CompanyDisplayName or "", vanData)
	return true, "✍️ Fresh sign writing applied!"
end

function VAN_ACTIONS.Paint(session, payload)
	local vanData = session.Data.Van
	local r = toInteger(payload.R, 0, 255)
	local g = toInteger(payload.G, 0, 255)
	local b = toInteger(payload.B, 0, 255)
	if not (r and g and b) then
		return false, "That isn't a valid colour."
	end
	if r == vanData.Paint[1] and g == vanData.Paint[2] and b == vanData.Paint[3] then
		return true, nil
	end
	if not trySpend(session, CONFIG.PaintPrice) then
		return false, ("A respray costs %s."):format(formatMoney(CONFIG.PaintPrice))
	end
	vanData.Paint = { r, g, b }
	applyVanPaint(session.Van, vanData.Paint)
	return true, "🎨 Respray complete!"
end

function VAN_ACTIONS.BuyProp(session, payload)
	local id = payload.Id
	local def = type(id) == "string" and VAN_PROPS[id]
	if not def then
		return false, "Unknown item."
	end
	local owned = session.Data.OwnedProps[id] or 0
	if owned >= CONFIG.MaxPropsPerType then
		return false, ("You can own up to %d of those."):format(CONFIG.MaxPropsPerType)
	end
	if not trySpend(session, def.Price) then
		return false, ("You need %s for a %s."):format(formatMoney(def.Price), def.DisplayName)
	end
	session.Data.OwnedProps[id] = owned + 1
	return true, ("%s %s bought. Place it in the grid."):format(def.Icon, def.DisplayName)
end

function VAN_ACTIONS.PlaceProp(session, payload)
	local id = payload.Id
	local def = type(id) == "string" and VAN_PROPS[id]
	if not def then
		return false, "Unknown item."
	end
	local x = toInteger(payload.X, 1, VAN_GRID.Cols)
	local y = toInteger(payload.Y, 1, VAN_GRID.Rows)
	if not x or not y then
		return false, "Pick a grid cell."
	end
	local rotated = payload.Rotated == true
	local layout = session.Data.Van.Layout
	local placed = 0
	for _, placement in layout do
		if placement.Id == id then
			placed += 1
		end
	end
	if placed >= (session.Data.OwnedProps[id] or 0) then
		return false, ("Buy another %s first."):format(def.DisplayName)
	end
	local cols, rows = footprint(id, rotated)
	if x + cols - 1 > VAN_GRID.Cols or y + rows - 1 > VAN_GRID.Rows then
		return false, "That won't fit there. Try rotating it."
	end
	local occupied = layoutOccupancy(layout)
	for cx = x, x + cols - 1 do
		for cy = y, y + rows - 1 do
			if occupied[cx .. ":" .. cy] then
				return false, "Something is already in that space."
			end
		end
	end
	table.insert(layout, { Id = id, X = x, Y = y, R = if rotated then 1 else 0 })
	rebuildVanLayout(session.Van, layout)
	return true, nil
end

function VAN_ACTIONS.RemoveProp(session, payload)
	local x = toInteger(payload.X, 1, VAN_GRID.Cols)
	local y = toInteger(payload.Y, 1, VAN_GRID.Rows)
	if not x or not y then
		return false, nil
	end
	local layout = session.Data.Van.Layout
	local index = layoutOccupancy(layout)[x .. ":" .. y]
	if not index then
		return false, nil
	end
	table.remove(layout, index)
	rebuildVanLayout(session.Van, layout)
	return true, nil
end

UpgradeVanEvent.OnServerEvent:Connect(function(player, action, payload)
	local session = getSession(player)
	if not session or not rateLimit(session, "Van", 4, 8) then
		return
	end
	if type(action) ~= "string" then
		return
	end
	local function reply(ok, message)
		UpgradeVanEvent:FireClient(player, { Action = "Result", Request = action, Ok = ok, Message = message })
		if message then
			notify(session, message, if ok then "success" else "error")
		end
	end

	if action == "RecoverVan" then
		local now = os.clock()
		if now - (session.LastRecover or 0) < CONFIG.RecoverVanCooldown then
			return reply(false, "The tow truck is already on its way.")
		end
		session.LastRecover = now
		spawnVan(session)
		return reply(true, "🚐 Your van has been recovered to your plot.")
	end

	local handler = VAN_ACTIONS[action]
	if not handler or type(payload) ~= "table" then
		return
	end
	if not session.InCustomiseZone then
		return reply(false, "Drive your van into the Van Upgrades garage first.")
	end
	local ok, message = handler(session, payload)
	if ok then
		requestSync(session)
		session.Profile:RequestSave()
	end
	reply(ok, message)
end)

--------------------------------------------------------------------------------
-- REMOTE: CleanCarEvent  (the raycast is re-checked here, on the server)
--------------------------------------------------------------------------------

local function rejectHit(session, reason, layerId)
	local now = os.clock()
	if now - (session.LastRejectClock or 0) < 0.6 then
		return
	end
	session.LastRejectClock = now
	CleanCarEvent:FireClient(session.Player, { Ok = false, Reason = reason, Layer = layerId })
end

CleanCarEvent.OnServerEvent:Connect(function(player, claimedPart, hitPosition, rayOrigin)
	local session = getSession(player)
	if not session or not rateLimit(session, "Clean", 12, 14) then
		return
	end
	if typeof(claimedPart) ~= "Instance" or not claimedPart:IsA("BasePart") then
		return
	end
	if not isFiniteVector(hitPosition) or not isFiniteVector(rayOrigin) then
		return
	end

	local job = session.Job
	if not job or job.Status ~= "Washing" or not claimedPart:IsDescendantOf(job.Model) then
		return rejectHit(session, "NoJob")
	end

	local character, _, root, head = characterParts(player)
	if not character then
		return
	end

	-- 1. The tool must be one this server issued, equipped, and owned.
	local tool = character:FindFirstChildOfClass("Tool")
	local toolId = tool and IssuedTools[tool] == player and tool:GetAttribute("ToolId")
	if type(toolId) ~= "string" or not TOOLS[toolId] or not session.Data.OwnedTools[toolId] then
		return rejectHit(session, "NoTool")
	end
	local now = os.clock()
	if now - (session.LastHitClock or 0) < TOOLS[toolId].FireInterval * 0.75 then
		return
	end

	-- 2. Geometry: in reach, from a believable camera position.
	if (root.Position - hitPosition).Magnitude > CONFIG.ToolRange then
		return rejectHit(session, "TooFar")
	end
	if (head.Position - rayOrigin).Magnitude > CONFIG.CameraMaxZoom + 15 then
		return
	end
	if not pointInPart(hitPosition, claimedPart, 1) then
		return
	end

	-- 3. Re-cast the ray. The first thing it meets must be dirt on this job.
	local offset = hitPosition - rayOrigin
	local distance = offset.Magnitude
	if distance < 0.05 or distance > 400 then
		return
	end
	local result = Workspace:Raycast(rayOrigin, offset.Unit * (distance + 1.5), serverRayParams())
	local target = result and result.Instance
	local dirt = target and job.Dirt[target]
	if not dirt or (target ~= claimedPart and (result.Position - hitPosition).Magnitude > 2) then
		return rejectHit(session, "Blocked")
	end

	-- 4. The mathematically correct tool + chemical for this exact layer.
	local layer = DIRT_LAYERS[dirt.Layer]
	local chemicalId = session.Data.ChemicalLoadout[toolId]
	if toolId ~= layer.Tool or chemicalId ~= layer.Chemical or not session.Data.OwnedChemicals[chemicalId] then
		return rejectHit(session, "WrongCombo", dirt.Layer)
	end
	if not prerequisitesMet(session, toolId) then
		return rejectHit(session, "MissingKit", dirt.Layer)
	end

	-- Apply: 4 validated hits take a segment from 0 to 1 transparency.
	session.LastHitClock = now
	dirt.Hits -= 1
	local gain = math.floor(layer.Value * job.Multiplier + 0.5)
	job.Bill += gain
	local cleared = dirt.Hits <= 0
	if cleared then
		job.Dirt[target] = nil
		job.Remaining -= 1
		target:Destroy()
	else
		target.Transparency = 1 - dirt.Hits / CONFIG.HitsPerSegment
		target:SetAttribute("HitsRemaining", dirt.Hits)
	end

	local percent = if job.Total > 0 then math.floor((1 - job.Remaining / job.Total) * 100 + 0.5) else 100
	job.Model:SetAttribute("BillTotal", job.Bill)
	job.Model:SetAttribute("CleanPercent", percent)
	CleanCarEvent:FireClient(player, {
		Ok = true,
		Layer = dirt.Layer,
		Gain = gain,
		Bill = job.Bill,
		Percent = percent,
		Position = result.Position,
		Normal = result.Normal,
		Cleared = cleared,
	})

	if job.Remaining <= 0 then
		completeWash(job)
	end
end)

--------------------------------------------------------------------------------
-- REMOTE: ClaimPaymentEvent  (the lump sum, paid once, at the desk)
--------------------------------------------------------------------------------

local function depositJob(session, job)
	local data = session.Data
	local amount = job.Bill
	data.LifetimeEarnings = math.min(CONFIG.MaxCash, data.LifetimeEarnings + amount)
	data.JobsCompleted += 1
	setCash(session, data.Cash + amount)
	if data.TutorialStep == STAGE.FirstJob then
		setStage(session, STAGE.Complete)
	end
	return amount
end

ClaimPaymentEvent.OnServerEvent:Connect(function(player, jobId)
	local session = getSession(player)
	if not session or not rateLimit(session, "Claim", 2, 3) then
		return
	end
	if type(jobId) ~= "string" then
		return
	end
	local job = session.Job
	if not job or job.Id ~= jobId or job.Status ~= "AwaitingPayment" then
		return
	end
	local _, _, root = characterParts(player)
	if not root or (root.Position - session.Plot.PayoutAnchor.Position).Magnitude > CONFIG.PayoutRange then
		return notify(session, "Walk over to the service desk to collect the payout.", "error")
	end

	-- Flip the status before anything can yield: a second claim finds "Paid".
	setJobStatus(job, "Paid")
	local amount = depositJob(session, job)
	session.Profile:RequestSave()
	ClaimPaymentEvent:FireClient(player, {
		Action = "Paid",
		JobId = job.Id,
		Amount = amount,
		Position = session.Plot.PayoutAnchor.Position,
		CustomerName = job.CustomerName,
	})
	task.spawn(runDeparture, job)
end)

--------------------------------------------------------------------------------
-- REMOTE: SnapshotFunction
--------------------------------------------------------------------------------

local CATALOGUE_PAYLOAD = {
	Kit = KIT_ITEMS,
	Tools = TOOLS,
	Chemicals = CHEMICALS,
	Layers = DIRT_LAYERS,
	Adverts = ADVERTS,
	Props = VAN_PROPS,
	Structures = PLOT_STRUCTURES,
	Fonts = SIGN_FONTS,
	Colours = SIGN_COLOURS,
	Stages = STAGE_INFO,
	Grid = { Cols = VAN_GRID.Cols, Rows = VAN_GRID.Rows },
	Prices = { SignWriting = CONFIG.SignWritingPrice, Paint = CONFIG.PaintPrice },
	HitsPerSegment = CONFIG.HitsPerSegment,
	ToolRange = CONFIG.ToolRange,
	PayoutRange = CONFIG.PayoutRange,
}

SnapshotFunction.OnServerInvoke = function(player, request)
	if request == "Catalogue" then
		return CATALOGUE_PAYLOAD
	end
	local session = getSession(player)
	if not session or not rateLimit(session, "Snapshot", 2, 6) then
		return nil
	end
	return buildSnapshot(session)
end

--------------------------------------------------------------------------------
-- PLAYER LIFECYCLE
--------------------------------------------------------------------------------

local function onPlayerAdded(player)
	player.CameraMaxZoomDistance = CONFIG.CameraMaxZoom

	local profile = Profiles:LoadProfileAsync(CONFIG.ProfileKeyPrefix .. player.UserId, function()
		return player.Parent == Players
	end)
	if not profile then
		if player.Parent == Players then
			player:Kick("We couldn't load your save. Please rejoin in a moment.")
		end
		return
	end
	if player.Parent ~= Players then
		profile:Release()
		return
	end

	profile:Reconcile()
	local data = profile.Data
	sanitizeData(data)
	sanitizeLayout(data)

	local session = { Player = player, Profile = profile, Data = data, Buckets = {}, Ready = false }
	Sessions[player] = session
	profile:ListenToRelease(function(reason)
		if reason == "Lost" and player.Parent == Players then
			player:Kick("Your save was opened on another server. Please rejoin.")
		end
	end)

	if not assignPlot(session) then
		Sessions[player] = nil
		profile:Release()
		player:Kick("This server's plots are all taken. Please join another server.")
		return
	end

	-- Resume the tutorial somewhere sensible.
	if data.TutorialStep == STAGE.CollectKit then
		data.TutorialStep = STAGE.DriveToStore
	end
	if data.TutorialStep >= STAGE.ReturnToPlot and not data.OwnedKit.Hose then
		grantStarterKit(session)
	end
	if data.TutorialStep > STAGE.NameCompany and data.CompanyName == "" then
		data.TutorialStep = STAGE.NameCompany
	end

	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local cashValue = Instance.new("IntValue")
	cashValue.Name = "Cash"
	cashValue.Value = data.Cash
	cashValue.Parent = leaderstats
	leaderstats.Parent = player
	session.CashValue = cashValue

	loadCompanyName(session)
	if Sessions[player] ~= session then
		return
	end
	spawnVan(session)
	session.Ready = true

	player.CharacterAdded:Connect(function(character)
		onCharacterAdded(session, character)
	end)
	if player.Character then
		task.spawn(onCharacterAdded, session, player.Character)
	end
	requestSync(session)
	tryStartNextCustomer(session)
end

local function onPlayerRemoving(player)
	local session = Sessions[player]
	if not session then
		return
	end
	Sessions[player] = nil
	session.Ready = false

	local job = session.Job
	if job then
		local status = job.Status
		if status == "ToPickup" or status == "CustomerWalking" or status == "AwaitingPayment" then
			depositJob(session, job) -- the work was finished; don't lose the bill
		elseif status == "Arriving" or status == "Washing" then
			session.Data.PendingCustomers = math.min(CONFIG.MaxQueuedCustomers, session.Data.PendingCustomers + 1)
		end
		destroyJob(job)
	end
	if session.Van and session.Van.Model then
		session.Van.Model:Destroy()
	end
	for tool, owner in IssuedTools do
		if owner == player then
			IssuedTools[tool] = nil
			tool:Destroy()
		end
	end
	releasePlot(session)
	session.Profile:Release()
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

-- Background saves, spread across the interval so they never arrive in a burst.
task.spawn(function()
	while true do
		task.wait(CONFIG.AutoSaveInterval)
		local active = Profiles:GetActiveProfiles()
		local gap = math.min(2, CONFIG.AutoSaveInterval / math.max(#active, 1))
		for _, profile in active do
			if profile:IsActive() then
				task.spawn(profile.Save, profile)
			end
			task.wait(gap)
		end
	end
end)

game:BindToClose(function()
	local pending = 0
	for player in Sessions do
		pending += 1
		task.spawn(function()
			onPlayerRemoving(player)
			pending -= 1
		end)
	end
	local started = os.clock()
	while pending > 0 and os.clock() - started < 25 do
		task.wait()
	end
end)

print(("[GameServer] Car Detailing Tycoon ready: %d plots, profile store %s."):format(
	#Plots,
	if Profiles.IsMock then "MOCK (in-memory)" else "LIVE"
))
