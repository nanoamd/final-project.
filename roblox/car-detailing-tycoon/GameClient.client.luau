--!nonstrict
--[[
	GameClient  ·  Car Detailing Tycoon
	LocalScript  ->  StarterPlayer.StarterPlayerScripts

	Everything the player feels in the world, and nothing the server has to
	trust. This script never decides money, progress or what got cleaned: it
	aims, asks, and then makes the answer look and sound good.

	  · Tool input: click / tap / gamepad, hold-to-spray, camera-to-surface
	    raycasts, a hover outline that says which tool and chemical a panel needs.
	  · Network: fires CleanCarEvent / ClaimPaymentEvent, listens for results.
	  · Effects: wet splats, polish sparkles, steam, ceramic glints, a gold coin
	    explosion and a cash-register "cha-ching".
	  · World UI: the live "Current Bill" billboard over every customer car and
	    the pulsing "Collect Payout!" indicator at the desk.
	  · The Caddy van's drive controller (the server hands the driver physics).
	  · Waypoint arrow and beacon for the starter quest.
	  · Tweened camera work: the intro, the branding reveal, payouts, and the
	    customisation garage.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ContextActionService = game:GetService("ContextActionService")
local TweenService = game:GetService("TweenService")
local CollectionService = game:GetService("CollectionService")
local SoundService = game:GetService("SoundService")
local Debris = game:GetService("Debris")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local camera = Workspace.CurrentCamera

local NetworkEvents = ReplicatedStorage:WaitForChild("NetworkEvents")
local CleanCarEvent = NetworkEvents:WaitForChild("CleanCarEvent")
local ClaimPaymentEvent = NetworkEvents:WaitForChild("ClaimPaymentEvent")
local QuestEvent = NetworkEvents:WaitForChild("QuestEvent")
local DataSyncEvent = NetworkEvents:WaitForChild("DataSyncEvent")
local SnapshotFunction = NetworkEvents:WaitForChild("SnapshotFunction")

--------------------------------------------------------------------------------
-- CLIENT SIGNALS  (shared with InterfaceController; both find-or-create them)
--------------------------------------------------------------------------------

local function getSignal(name)
	local folder = ReplicatedStorage:FindFirstChild("DetailingClientSignals")
	if not folder then
		folder = Instance.new("Folder")
		folder.Name = "DetailingClientSignals"
		folder.Parent = ReplicatedStorage
	end
	local signal = folder:FindFirstChild(name)
	if not signal then
		signal = Instance.new("BindableEvent")
		signal.Name = name
		signal.Parent = folder
	end
	return signal
end

local CinematicSignal = getSignal("Cinematic") -- (isActive: boolean)
local CameraFocusSignal = getSignal("CameraFocus") -- ("Van" | "VanInterior" | nil)
local ToastSignal = getSignal("Toast") -- (text: string, kind: string)

--------------------------------------------------------------------------------
-- CONFIGURATION
--------------------------------------------------------------------------------

-- Built-in engine sounds so the place works out of the box. Swap these for your
-- own uploaded assets (rbxassetid://...) for a real cash register and pressure washer.
local SOUNDS = {
	Splash = { Id = "rbxasset://sounds/impact_water.mp3", Volume = 0.5 },
	Polish = { Id = "rbxasset://sounds/clickfast.wav", Volume = 0.45 },
	Steam = { Id = "rbxasset://sounds/swoosh.wav", Volume = 0.4 },
	Buff = { Id = "rbxasset://sounds/electronicpingshort.wav", Volume = 0.25 },
	Cleared = { Id = "rbxasset://sounds/electronicpingshort.wav", Volume = 0.45 },
	Reject = { Id = "rbxasset://sounds/button.wav", Volume = 0.5 },
	Register = { Id = "rbxasset://sounds/electronicpingshort.wav", Volume = 0.8 },
	Coin = { Id = "rbxasset://sounds/clickfast.wav", Volume = 0.5 },
	Whoosh = { Id = "rbxasset://sounds/swoosh.wav", Volume = 0.5 },
}

local TEXTURES = {
	Smoke = "rbxasset://textures/particles/smoke_main.dds",
	Sparkle = "rbxasset://textures/particles/sparkles_main.dds",
}

local GOLD = Color3.fromRGB(255, 200, 40)
local CASH_GREEN = Color3.fromRGB(60, 220, 100)
local INK = Color3.fromRGB(28, 38, 72)
local NEON_GREEN = Color3.fromRGB(0, 255, 140)
local METRES_PER_STUD = 0.28

local REJECT_TEXT = {
	NoJob = "This car isn't ready for you yet.",
	NoTool = "Equip a detailing tool from your toolbar.",
	TooFar = "Move closer to the car.",
	Blocked = "You can't reach that spot from here.",
	MissingKit = "That tool needs its starter-kit item.",
}

--------------------------------------------------------------------------------
-- STATE
--------------------------------------------------------------------------------

local Catalogue = nil
local Snapshot = nil

local fxFolder = Instance.new("Folder")
fxFolder.Name = "DetailingClientFX"
fxFolder.Parent = Workspace

local function getHumanoid()
	local character = player.Character
	return character and character:FindFirstChildOfClass("Humanoid")
end

local function getRoot()
	local character = player.Character
	return character and character:FindFirstChild("HumanoidRootPart")
end

local function getWorld()
	return Workspace:FindFirstChild("CarDetailingTycoon")
end

local function getPlotModel()
	local plotId = player:GetAttribute("PlotId")
	local world = getWorld()
	local plots = world and world:FindFirstChild("Plots")
	return plotId and plots and plots:FindFirstChild("Plot_" .. plotId)
end

local function getMarker(name)
	local plot = getPlotModel()
	local markers = plot and plot:FindFirstChild("Markers")
	return markers and markers:FindFirstChild(name)
end

local function getVan()
	local world = getWorld()
	local vans = world and world:FindFirstChild("Vans")
	return vans and vans:FindFirstChild("Van_" .. player.UserId)
end

local function getStore()
	local world = getWorld()
	local environment = world and world:FindFirstChild("Environment")
	return environment and environment:FindFirstChild("HardwareStore")
end

local function formatMoney(amount)
	local whole = tostring(math.floor(amount + 0.5))
	local formatted = whole:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if formatted:sub(1, 1) == "," then
		formatted = formatted:sub(2)
	end
	return "£" .. formatted
end

local function toast(text, kind)
	ToastSignal:Fire(text, kind or "info")
end

local function tween(instance, duration, goals, style, direction)
	local created = TweenService:Create(
		instance,
		TweenInfo.new(duration, style or Enum.EasingStyle.Quad, direction or Enum.EasingDirection.Out),
		goals
	)
	created:Play()
	return created
end

local function localPart(props)
	local part = Instance.new(props.ClassName or "Part")
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.CastShadow = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	for key, value in props do
		if key ~= "ClassName" and key ~= "Parent" then
			(part :: any)[key] = value
		end
	end
	part.Parent = props.Parent or fxFolder
	return part
end

--------------------------------------------------------------------------------
-- SOUND
--------------------------------------------------------------------------------

local soundTemplates = {}
for key, spec in SOUNDS do
	local sound = Instance.new("Sound")
	sound.Name = "Detailing_" .. key
	sound.SoundId = spec.Id
	sound.Volume = spec.Volume
	sound.Parent = SoundService
	soundTemplates[key] = sound
end

local function playSound(key, pitch, volumeScale)
	local template = soundTemplates[key]
	if not template then
		return
	end
	local sound = template:Clone()
	sound.PlaybackSpeed = pitch or 1
	sound.Volume = template.Volume * (volumeScale or 1)
	sound.Parent = SoundService
	sound:Play()
	Debris:AddItem(sound, 4)
end

local function playChaChing()
	playSound("Register", 1.15)
	task.delay(0.09, playSound, "Register", 1.6)
	for index = 1, 6 do
		task.delay(0.12 + index * 0.05, playSound, "Coin", 1.4 + index * 0.12, 0.7)
	end
end

--------------------------------------------------------------------------------
-- FX SCREEN LAYER  (letterbox, captions, hints, payout banner)
--------------------------------------------------------------------------------

local fxGui = Instance.new("ScreenGui")
fxGui.Name = "DetailingFX"
fxGui.ResetOnSpawn = false
fxGui.IgnoreGuiInset = true
fxGui.DisplayOrder = 5
fxGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
fxGui.Parent = playerGui

local function letterboxBar(isTop)
	local bar = Instance.new("Frame")
	bar.Name = if isTop then "LetterboxTop" else "LetterboxBottom"
	bar.BackgroundColor3 = Color3.new(0, 0, 0)
	bar.BorderSizePixel = 0
	bar.AnchorPoint = Vector2.new(0, if isTop then 1 else 0)
	bar.Position = UDim2.fromScale(0, if isTop then 0 else 1)
	bar.Size = UDim2.fromScale(1, 0.12)
	bar.ZIndex = 20
	bar.Parent = fxGui
	return bar
end
local letterTop = letterboxBar(true)
local letterBottom = letterboxBar(false)

local caption = Instance.new("TextLabel")
caption.Name = "Caption"
caption.AnchorPoint = Vector2.new(0.5, 1)
caption.Position = UDim2.new(0.5, 0, 1, -24)
caption.Size = UDim2.new(0.8, 0, 0.07, 0)
caption.BackgroundTransparency = 1
caption.Font = Enum.Font.FredokaOne
caption.TextScaled = true
caption.TextColor3 = Color3.new(1, 1, 1)
caption.TextTransparency = 1
caption.ZIndex = 21
caption.Parent = fxGui
local captionStroke = Instance.new("UIStroke")
captionStroke.Thickness = 2
captionStroke.Transparency = 1
captionStroke.Parent = caption

local skipButton = Instance.new("TextButton")
skipButton.Name = "Skip"
skipButton.AnchorPoint = Vector2.new(1, 0)
skipButton.Position = UDim2.new(1, -20, 0, 60)
skipButton.Size = UDim2.fromOffset(110, 40)
skipButton.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
skipButton.BackgroundTransparency = 0.15
skipButton.Font = Enum.Font.FredokaOne
skipButton.Text = "Skip ▶"
skipButton.TextSize = 22
skipButton.TextColor3 = INK
skipButton.Visible = false
skipButton.ZIndex = 22
skipButton.Parent = fxGui
do
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(1, 0)
	corner.Parent = skipButton
end

local hintLabel = Instance.new("TextLabel")
hintLabel.Name = "Hint"
hintLabel.AnchorPoint = Vector2.new(0.5, 1)
hintLabel.Position = UDim2.new(0.5, 0, 1, -190)
hintLabel.Size = UDim2.fromOffset(520, 34)
hintLabel.BackgroundColor3 = INK
hintLabel.BackgroundTransparency = 1
hintLabel.Font = Enum.Font.FredokaOne
hintLabel.TextSize = 22
hintLabel.TextColor3 = Color3.new(1, 1, 1)
hintLabel.TextTransparency = 1
hintLabel.Parent = fxGui
do
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(1, 0)
	corner.Parent = hintLabel
end

local hintToken = 0
local function showHint(text, color)
	hintToken += 1
	local token = hintToken
	hintLabel.Text = text
	hintLabel.BackgroundColor3 = color or INK
	hintLabel.TextTransparency = 0
	hintLabel.BackgroundTransparency = 0.2
	task.delay(1.8, function()
		if token == hintToken then
			tween(hintLabel, 0.4, { TextTransparency = 1, BackgroundTransparency = 1 })
		end
	end)
end

local banner = Instance.new("Frame")
banner.Name = "PayoutBanner"
banner.AnchorPoint = Vector2.new(0.5, 0.5)
banner.Position = UDim2.fromScale(0.5, 0.32)
banner.Size = UDim2.fromOffset(460, 130)
banner.BackgroundTransparency = 1
banner.Visible = false
banner.ZIndex = 30
banner.Parent = fxGui
local bannerScale = Instance.new("UIScale")
bannerScale.Parent = banner
local bannerTitle = Instance.new("TextLabel")
bannerTitle.Size = UDim2.fromScale(1, 0.35)
bannerTitle.BackgroundTransparency = 1
bannerTitle.Font = Enum.Font.FredokaOne
bannerTitle.Text = "PAYMENT RECEIVED"
bannerTitle.TextScaled = true
bannerTitle.TextColor3 = Color3.new(1, 1, 1)
bannerTitle.ZIndex = 30
bannerTitle.Parent = banner
local bannerAmount = Instance.new("TextLabel")
bannerAmount.Position = UDim2.fromScale(0, 0.35)
bannerAmount.Size = UDim2.fromScale(1, 0.65)
bannerAmount.BackgroundTransparency = 1
bannerAmount.Font = Enum.Font.FredokaOne
bannerAmount.TextScaled = true
bannerAmount.TextColor3 = GOLD
bannerAmount.ZIndex = 30
bannerAmount.Parent = banner
for _, label in { bannerTitle, bannerAmount } do
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 4
	stroke.Color = INK
	stroke.Parent = label
end

--------------------------------------------------------------------------------
-- CINEMATIC CAMERA
--------------------------------------------------------------------------------

local cinematicActive = false
local cinematicSkipped = false
local cinematicQueue = {}
local focusMode = nil

local function setLetterbox(visible)
	tween(letterTop, 0.5, { Position = UDim2.fromScale(0, if visible then 0.12 else 0) }, Enum.EasingStyle.Quint)
	tween(letterBottom, 0.5, { Position = UDim2.fromScale(0, if visible then 0.88 else 1) }, Enum.EasingStyle.Quint)
end

local function setCaption(text)
	if text then
		caption.Text = text
		tween(caption, 0.35, { TextTransparency = 0 })
		tween(captionStroke, 0.35, { Transparency = 0 })
	else
		tween(caption, 0.35, { TextTransparency = 1 })
		tween(captionStroke, 0.35, { Transparency = 1 })
	end
end

local function restoreCamera()
	camera.CameraType = Enum.CameraType.Custom
	local humanoid = getHumanoid()
	if humanoid then
		camera.CameraSubject = humanoid
	end
end

-- Waits, returning early (true) if the player pressed Skip.
local function waitOrSkip(seconds)
	local started = os.clock()
	while os.clock() - started < seconds do
		if cinematicSkipped then
			return true
		end
		task.wait()
	end
	return cinematicSkipped
end

local function moveCamera(cframe, duration, style)
	return tween(camera, duration, { CFrame = cframe }, style or Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
end

-- Cinematics run one at a time; later ones queue behind the current one.
local function playCinematic(sequence, skippable)
	table.insert(cinematicQueue, { Sequence = sequence, Skippable = skippable })
	if cinematicActive then
		return
	end
	cinematicActive = true
	while #cinematicQueue > 0 do
		local entry = table.remove(cinematicQueue, 1)
		cinematicSkipped = false
		focusMode = nil
		CinematicSignal:Fire(true)
		camera.CameraType = Enum.CameraType.Scriptable
		setLetterbox(true)
		skipButton.Visible = entry.Skippable == true
		local ok, err = pcall(entry.Sequence)
		if not ok then
			warn("[GameClient] Cinematic error: " .. tostring(err))
		end
		skipButton.Visible = false
		setCaption(nil)
		setLetterbox(false)
		restoreCamera()
		CinematicSignal:Fire(false)
	end
	cinematicActive = false
end

skipButton.Activated:Connect(function()
	cinematicSkipped = true
end)

local function waitForInstance(getter, timeout)
	local started = os.clock()
	while os.clock() - started < (timeout or 10) do
		local found = getter()
		if found then
			return found
		end
		task.wait(0.2)
	end
	return nil
end

local function playIntro()
	local plot = waitForInstance(getPlotModel)
	local van = waitForInstance(getVan)
	local store = getStore()
	if not plot or not van or not van.PrimaryPart then
		return
	end
	playCinematic(function()
		local sign = plot:FindFirstChild("EntranceSign")
		local storePart = store and store:FindFirstChild("Building")
		local plotCentre = plot:GetPivot().Position
		local chassis = van.PrimaryPart

		camera.CFrame = CFrame.lookAt(plotCentre + Vector3.new(-160, 140, -240), plotCentre)
		setCaption("Welcome to Car Detailing Tycoon")
		moveCamera(CFrame.lookAt(plotCentre + Vector3.new(-60, 70, -110), plotCentre), 3.2)
		if waitOrSkip(3.2) then
			return
		end
		if sign then
			setCaption("This is your plot. Right now it doesn't even have a name.")
			moveCamera(CFrame.lookAt(sign.Position + Vector3.new(14, 2, -30), sign.Position), 2.6)
			if waitOrSkip(2.8) then
				return
			end
		end
		setCaption("And this classic white Caddy van is the whole business... for now.")
		moveCamera(CFrame.lookAt((chassis.CFrame * CFrame.new(11, 3, -14)).Position, chassis.Position), 2.6)
		if waitOrSkip(3) then
			return
		end
		if storePart then
			setCaption("First stop: the Hardware Supply Store. Your free Starter Detailing Kit is waiting.")
			moveCamera(CFrame.lookAt(storePart.Position + Vector3.new(60, 45, 110), storePart.Position), 3)
			if waitOrSkip(3.4) then
				return
			end
		end
		setCaption("Walk up to the van, press F to drive, and follow the green arrow!")
		local root = getRoot()
		if root then
			moveCamera(CFrame.lookAt(root.Position + Vector3.new(0, 8, 16), root.Position), 1.6)
			waitOrSkip(1.8)
		end
	end, true)
end

local function playBrandingReveal(companyName)
	local plot = getPlotModel()
	local van = getVan()
	playCinematic(function()
		local sign = plot and plot:FindFirstChild("EntranceSign")
		if sign then
			setCaption(("%s is open for business!"):format(companyName))
			camera.CFrame = CFrame.lookAt(sign.Position + Vector3.new(0, -4, -50), sign.Position)
			moveCamera(CFrame.lookAt(sign.Position + Vector3.new(8, -2, -24), sign.Position), 2)
			task.wait(2.1)
		end
		local chassis = van and van.PrimaryPart
		local wall = van and van:FindFirstChild("RightWall")
		if chassis and wall then
			setCaption("Fresh sign writing on the van, too.")
			moveCamera(CFrame.lookAt((chassis.CFrame * CFrame.new(16, 3, 2)).Position, wall.Position), 1.8)
			task.wait(0.6)
			for _, side in { "LeftWall", "RightWall" } do
				local panel = van:FindFirstChild(side)
				if panel then
					local emitterPart = localPart({ Size = Vector3.new(0.2, 3, 8), CFrame = panel.CFrame, Transparency = 1 })
					local sparkle = Instance.new("ParticleEmitter")
					sparkle.Texture = TEXTURES.Sparkle
					sparkle.Color = ColorSequence.new(GOLD)
					sparkle.Size = NumberSequence.new(0.6, 0)
					sparkle.Lifetime = NumberRange.new(0.6, 1)
					sparkle.Speed = NumberRange.new(2, 5)
					sparkle.SpreadAngle = Vector2.new(180, 180)
					sparkle.LightEmission = 1
					sparkle.Rate = 0
					sparkle.Parent = emitterPart
					sparkle:Emit(40)
					Debris:AddItem(emitterPart, 2)
				end
			end
			playSound("Cleared", 1.3)
			task.wait(1.6)
		end
	end, false)
end

local function playPayoutCamera(position)
	local plot = getPlotModel()
	if not plot then
		return
	end
	task.spawn(playCinematic, function()
		local origin = plot:GetPivot()
		local eye = position + origin:VectorToWorldSpace(Vector3.new(-16, 8, -14))
		camera.CFrame = CFrame.lookAt(camera.CFrame.Position, position)
		moveCamera(CFrame.lookAt(eye, position), 0.8, Enum.EasingStyle.Quart)
		task.wait(2.3)
	end, false)
end

-- Garage focus: a slow orbit of the van while the customiser is open.
local focusAngle = 0
CameraFocusSignal.Event:Connect(function(mode)
	if cinematicActive then
		return
	end
	local van = getVan()
	local rearDoor = van and van:FindFirstChild("RearDoor")
	local rearGlass = van and van:FindFirstChild("RearGlass")
	if mode == "VanInterior" then
		for _, part in { rearDoor, rearGlass } do
			if part then
				part.LocalTransparencyModifier = 0.85
			end
		end
	else
		for _, part in { rearDoor, rearGlass } do
			if part then
				part.LocalTransparencyModifier = 0
			end
		end
	end
	if mode and van and van.PrimaryPart then
		focusMode = mode
		focusAngle = 0.6
		camera.CameraType = Enum.CameraType.Scriptable
	else
		focusMode = nil
		restoreCamera()
	end
end)

RunService.RenderStepped:Connect(function(dt)
	if not focusMode or cinematicActive then
		return
	end
	local van = getVan()
	local chassis = van and van.PrimaryPart
	if not chassis then
		focusMode = nil
		restoreCamera()
		return
	end
	local target
	if focusMode == "VanInterior" then
		local eye = (chassis.CFrame * CFrame.new(0, 7.5, 17)).Position
		target = CFrame.lookAt(eye, (chassis.CFrame * CFrame.new(0, 1, 3)).Position)
	else
		focusAngle += dt * 0.18
		local offset = Vector3.new(math.sin(focusAngle) * 20, 8, math.cos(focusAngle) * 20)
		target = CFrame.lookAt(chassis.Position + offset, chassis.Position + Vector3.new(0, 1.5, 0))
	end
	camera.CFrame = camera.CFrame:Lerp(target, math.min(1, dt * 4))
end)

--------------------------------------------------------------------------------
-- WAYPOINT  (a floating neon arrow over the player or van, and a beacon at
-- the destination)
--------------------------------------------------------------------------------

local function buildArrow(name, scale)
	local model = Instance.new("Model")
	model.Name = name
	local parts = {}
	local function add(className, size, offset)
		local part = localPart({
			ClassName = className,
			Size = size * scale,
			Color = NEON_GREEN,
			Material = Enum.Material.Neon,
			Parent = model,
		})
		table.insert(parts, { Part = part, Offset = CFrame.new(offset.Position * scale) * offset.Rotation })
	end
	add("Part", Vector3.new(0.9, 0.45, 3.2), CFrame.new(0, 0, 1)) -- shaft
	-- Two mirrored wedges make a flat triangular head pointing along -Z.
	add("WedgePart", Vector3.new(0.45, 1.3, 2.2), CFrame.new(-0.65, 0, -1.7) * CFrame.Angles(0, 0, math.rad(90)))
	add("WedgePart", Vector3.new(0.45, 1.3, 2.2), CFrame.new(0.65, 0, -1.7) * CFrame.Angles(0, 0, math.rad(-90)))
	model.Parent = fxFolder
	return {
		Model = model,
		Place = function(cframe)
			for _, entry in parts do
				entry.Part.CFrame = cframe * entry.Offset
			end
		end,
		SetVisible = function(visible)
			for _, entry in parts do
				entry.Part.Transparency = if visible then 0 else 1
			end
		end,
	}
end

local guideArrow = buildArrow("GuideArrow", 1)
local beaconArrow = buildArrow("BeaconArrow", 1.6)
guideArrow.SetVisible(false)
beaconArrow.SetVisible(false)

local beaconPillar = localPart({
	Name = "Beacon",
	Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(80, 3, 3),
	Color = NEON_GREEN,
	Material = Enum.Material.Neon,
	Transparency = 1,
})

local beaconGui = Instance.new("BillboardGui")
beaconGui.Name = "WaypointLabel"
beaconGui.Size = UDim2.fromOffset(260, 56)
beaconGui.StudsOffsetWorldSpace = Vector3.new(0, 14, 0)
beaconGui.AlwaysOnTop = true
beaconGui.LightInfluence = 0
beaconGui.Enabled = false
beaconGui.ResetOnSpawn = false
beaconGui.Parent = playerGui
local beaconText = Instance.new("TextLabel")
beaconText.Size = UDim2.fromScale(1, 1)
beaconText.BackgroundTransparency = 1
beaconText.Font = Enum.Font.FredokaOne
beaconText.TextScaled = true
beaconText.TextColor3 = Color3.new(1, 1, 1)
beaconText.Parent = beaconGui
do
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 3
	stroke.Color = Color3.fromRGB(0, 90, 50)
	stroke.Parent = beaconText
end

local function currentWaypoint()
	if not Snapshot then
		return nil
	end
	local stage = Snapshot.TutorialStep
	local humanoid = getHumanoid()
	local van = getVan()
	local inVan = humanoid and van and humanoid.SeatPart and humanoid.SeatPart:IsDescendantOf(van)
	local store = getStore()

	if stage == 1 then
		if not inVan and van and van.PrimaryPart then
			return van.PrimaryPart.Position, "🚐 Your Caddy Van"
		end
		local zone = store and store:FindFirstChild("StoreZone")
		return zone and zone.Position, "🏪 Hardware Supply Store"
	elseif stage == 2 then
		local button = store and store:FindFirstChild("KitButton")
		return button and button.Position, "🧰 Free Starter Kit"
	elseif stage == 3 then
		if not inVan and van and van.PrimaryPart then
			return van.PrimaryPart.Position, "🚐 Your Caddy Van"
		end
		local spawnMarker = getMarker("VanSpawn")
		return spawnMarker and spawnMarker.Position, "🏠 Your Plot"
	end

	local job = Snapshot.ActiveJob
	if job then
		if job.Status == "Washing" then
			local bay = getMarker("WashBayPoint")
			return bay and bay.Position, "🧽 Wash Bay"
		elseif job.Status == "AwaitingPayment" then
			local anchor = getMarker("PayoutAnchor")
			return anchor and anchor.Position, "💰 Collect Payout"
		end
	end
	return nil
end

RunService.RenderStepped:Connect(function()
	local target, label = currentWaypoint()
	local root = getRoot()
	if not target or not root or cinematicActive then
		guideArrow.SetVisible(false)
		beaconArrow.SetVisible(false)
		beaconPillar.Transparency = 1
		beaconGui.Enabled = false
		return
	end

	local now = os.clock()
	local humanoid = getHumanoid()
	local seat = humanoid and humanoid.SeatPart
	local anchor = if seat then seat.Position + Vector3.new(0, 9, 0) else root.Position + Vector3.new(0, 6, 0)
	local flatDirection = Vector3.new(target.X - anchor.X, 0, target.Z - anchor.Z)
	local distance = flatDirection.Magnitude

	if distance > 14 then
		guideArrow.SetVisible(true)
		local bob = math.sin(now * 3) * 0.35
		local position = anchor + Vector3.new(0, bob, 0)
		guideArrow.Place(CFrame.lookAt(position, position + flatDirection.Unit))
	else
		guideArrow.SetVisible(false)
	end

	beaconArrow.SetVisible(true)
	local beaconTop = target + Vector3.new(0, 9 + math.sin(now * 2.5) * 0.8, 0)
	beaconArrow.Place(CFrame.lookAt(beaconTop, beaconTop - Vector3.yAxis, Vector3.zAxis) * CFrame.Angles(0, 0, now * 1.5))
	beaconPillar.Transparency = 0.7
	beaconPillar.CFrame = CFrame.new(target + Vector3.new(0, 40, 0)) * CFrame.Angles(0, 0, math.rad(90))
	beaconGui.Adornee = beaconPillar
	beaconGui.StudsOffsetWorldSpace = Vector3.new(0, -24, 0)
	beaconGui.Enabled = true
	beaconText.Text = ("%s  •  %d m"):format(label, math.floor(distance * METRES_PER_STUD + 0.5))
end)

--------------------------------------------------------------------------------
-- VAN DRIVE CONTROLLER
-- The server gives the driver network ownership, so motor targets set here
-- drive the physics directly. The wheel and steering sign conventions are
-- self-checked: if pressing W makes the van accelerate backwards (or D turns
-- it left), the sign flips within half a second.
--------------------------------------------------------------------------------

local Drive = {
	Van = nil,
	Motors = {},
	Servos = {},
	ForwardSign = -1,
	SteerSign = -1,
	LastSpeed = 0,
	WrongDrive = 0,
	WrongSteer = 0,
}

local function bindVan(van)
	Drive.Van = van
	Drive.Motors = {}
	Drive.Servos = {}
	for _, descendant in van:GetDescendants() do
		if descendant:IsA("HingeConstraint") then
			if descendant:GetAttribute("DriveMotor") then
				table.insert(Drive.Motors, descendant)
			elseif descendant:GetAttribute("SteerServo") then
				table.insert(Drive.Servos, descendant)
			end
		end
	end
	Drive.ForwardSign = van:GetAttribute("CalibratedForwardSign") or van:GetAttribute("WheelForwardSign") or -1
	Drive.SteerSign = van:GetAttribute("CalibratedSteerSign") or van:GetAttribute("SteerSign") or -1
	Drive.LastSpeed = 0
	Drive.WrongDrive = 0
	Drive.WrongSteer = 0
end

local function releaseDrive()
	for _, motor in Drive.Motors do
		if motor.Parent then
			motor.AngularVelocity = 0
		end
	end
	for _, servo in Drive.Servos do
		if servo.Parent then
			servo.TargetAngle = 0
		end
	end
	Drive.Van = nil
	Drive.Motors = {}
	Drive.Servos = {}
end

RunService.Heartbeat:Connect(function(dt)
	local humanoid = getHumanoid()
	local seat = humanoid and humanoid.SeatPart
	if not (seat and seat:IsA("VehicleSeat") and seat:GetAttribute("IsDetailingVan")) then
		if Drive.Van then
			releaseDrive()
		end
		return
	end
	local van = seat.Parent
	if Drive.Van ~= van then
		bindVan(van)
	end
	local chassis = van.PrimaryPart
	if not chassis then
		return
	end

	local throttle = seat.ThrottleFloat
	local steer = seat.SteerFloat
	local maxSpeed = van:GetAttribute("MaxSpeed") or 55
	local reverseSpeed = van:GetAttribute("ReverseSpeed") or 20
	local radius = van:GetAttribute("WheelRadius") or 1.5
	local speed = chassis.AssemblyLinearVelocity:Dot(chassis.CFrame.LookVector)
	local acceleration = (speed - Drive.LastSpeed) / math.max(dt, 1 / 240)
	Drive.LastSpeed = speed

	local targetSpeed, torque = 0, 2500 -- coasting: gentle engine braking
	if throttle > 0.05 then
		if speed < -2 then
			torque = 16000 -- braking out of reverse
		else
			targetSpeed, torque = throttle * maxSpeed, 9000
		end
	elseif throttle < -0.05 then
		if speed > 2 then
			torque = 16000 -- braking
		else
			targetSpeed, torque = throttle * reverseSpeed, 7000
		end
	end
	for _, motor in Drive.Motors do
		motor.MotorMaxTorque = torque
		motor.AngularVelocity = Drive.ForwardSign * targetSpeed / radius
	end

	local speedFactor = math.clamp(math.abs(speed) / maxSpeed, 0, 1)
	local maxAngle = (van:GetAttribute("MaxSteerAngle") or 32) * (1 - 0.55 * speedFactor)
	for _, servo in Drive.Servos do
		servo.TargetAngle = Drive.SteerSign * steer * maxAngle
	end

	-- Self-check the conventions.
	local drivingWrongWay = (targetSpeed > 1 and speed < -3 and acceleration < -2) or (targetSpeed < -1 and speed > 3 and acceleration > 2)
	Drive.WrongDrive = if drivingWrongWay then Drive.WrongDrive + dt else math.max(0, Drive.WrongDrive - dt)
	if Drive.WrongDrive > 0.5 then
		Drive.ForwardSign = -Drive.ForwardSign
		van:SetAttribute("CalibratedForwardSign", Drive.ForwardSign)
		Drive.WrongDrive = 0
	end
	local yawRate = chassis.AssemblyAngularVelocity.Y
	local steeringWrongWay = speed > 8 and math.abs(steer) > 0.5 and math.abs(yawRate) > 0.3 and math.sign(yawRate) == math.sign(steer)
	Drive.WrongSteer = if steeringWrongWay then Drive.WrongSteer + dt else math.max(0, Drive.WrongSteer - dt)
	if Drive.WrongSteer > 0.4 then
		Drive.SteerSign = -Drive.SteerSign
		van:SetAttribute("CalibratedSteerSign", Drive.SteerSign)
		Drive.WrongSteer = 0
	end
end)

--------------------------------------------------------------------------------
-- CLEANING EFFECTS
--------------------------------------------------------------------------------

local function emitter(parent, props)
	local particles = Instance.new("ParticleEmitter")
	particles.Rate = 0
	particles.EmissionDirection = Enum.NormalId.Front
	for key, value in props do
		(particles :: any)[key] = value
	end
	particles.Parent = parent
	return particles
end

local function effectAnchor(position, normal, life)
	local anchor = localPart({
		Name = "FxAnchor",
		Size = Vector3.new(0.2, 0.2, 0.2),
		CFrame = CFrame.lookAt(position, position + (normal or Vector3.yAxis)),
		Transparency = 1,
	})
	Debris:AddItem(anchor, life or 2.5)
	return anchor
end

local function droplets(position, normal, color, count)
	for _ = 1, count do
		local drop = localPart({
			Name = "Droplet",
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(0.18, 0.18, 0.18),
			CFrame = CFrame.new(position + normal * 0.2),
			Color = color,
			Material = Enum.Material.Glass,
			Transparency = 0.2,
			Anchored = false,
			CollisionGroup = "DetailingFX",
		})
		drop.AssemblyLinearVelocity = normal * math.random(6, 12) + Vector3.new(math.random(-5, 5), math.random(3, 8), math.random(-5, 5))
		Debris:AddItem(drop, 0.9)
	end
end

local function sprayBeam(toolNozzle, position, color, width)
	if not toolNozzle then
		return
	end
	local target = effectAnchor(position, nil, 0.2)
	local endpoint = Instance.new("Attachment")
	endpoint.Parent = target
	local beam = Instance.new("Beam")
	beam.Attachment0 = toolNozzle
	beam.Attachment1 = endpoint
	beam.Width0 = width * 0.4
	beam.Width1 = width
	beam.Color = ColorSequence.new(color)
	beam.Transparency = NumberSequence.new(0.25, 0.6)
	beam.LightEmission = 0.6
	beam.FaceCamera = true
	beam.Segments = 6
	beam.Parent = target
end

local TOOL_EFFECTS = {}

TOOL_EFFECTS.HighPressureWasher = function(position, normal, nozzle, strong)
	sprayBeam(nozzle, position, Color3.fromRGB(200, 235, 255), 0.5)
	local anchor = effectAnchor(position, normal)
	emitter(anchor, {
		Texture = TEXTURES.Smoke,
		Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), Color3.fromRGB(190, 225, 255)),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 1.8) }),
		Transparency = NumberSequence.new(0.2, 1),
		Lifetime = NumberRange.new(0.35, 0.7),
		Speed = NumberRange.new(5, 11),
		SpreadAngle = Vector2.new(55, 55),
		Acceleration = Vector3.new(0, -18, 0),
	}):Emit(if strong then 26 else 14)
	droplets(position, normal, Color3.fromRGB(170, 215, 255), if strong then 8 else 4)
	playSound("Splash", 0.9 + math.random() * 0.3)
end

TOOL_EFFECTS.RotaryPolisher = function(position, normal, _, strong)
	local anchor = effectAnchor(position, normal)
	emitter(anchor, {
		Texture = TEXTURES.Sparkle,
		Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), Color3.fromRGB(255, 220, 140)),
		Size = NumberSequence.new(0.5, 0),
		Lifetime = NumberRange.new(0.3, 0.6),
		Speed = NumberRange.new(2, 6),
		SpreadAngle = Vector2.new(80, 80),
		RotSpeed = NumberRange.new(-360, 360),
		LightEmission = 1,
	}):Emit(if strong then 30 else 12)
	playSound("Polish", 0.8 + math.random() * 0.4)
end

TOOL_EFFECTS.SteamExtractor = function(position, normal, nozzle, strong)
	sprayBeam(nozzle, position, Color3.fromRGB(240, 240, 240), 0.35)
	local anchor = effectAnchor(position, normal, 3)
	emitter(anchor, {
		Texture = TEXTURES.Smoke,
		Color = ColorSequence.new(Color3.fromRGB(250, 250, 250)),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.4), NumberSequenceKeypoint.new(1, 2.4) }),
		Transparency = NumberSequence.new(0.35, 1),
		Lifetime = NumberRange.new(0.8, 1.4),
		Speed = NumberRange.new(1.5, 3.5),
		SpreadAngle = Vector2.new(35, 35),
		Acceleration = Vector3.new(0, 4, 0),
	}):Emit(if strong then 20 else 10)
	playSound("Steam", 0.7 + math.random() * 0.2)
end

TOOL_EFFECTS.DrillBuffer = function(position, normal, _, strong)
	local anchor = effectAnchor(position, normal)
	emitter(anchor, {
		Texture = TEXTURES.Sparkle,
		Color = ColorSequence.new(Color3.fromRGB(150, 255, 230), Color3.fromRGB(255, 255, 255)),
		Size = NumberSequence.new(0.7, 0),
		Lifetime = NumberRange.new(0.4, 0.8),
		Speed = NumberRange.new(1, 4),
		SpreadAngle = Vector2.new(180, 180),
		LightEmission = 1,
	}):Emit(if strong then 36 else 16)
	local ring = localPart({
		Name = "GlintRing",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.05, 0.4, 0.4),
		CFrame = CFrame.lookAt(position + normal * 0.08, position + normal * 2) * CFrame.Angles(0, math.rad(90), 0),
		Color = Color3.fromRGB(180, 255, 240),
		Material = Enum.Material.Neon,
		Transparency = 0.2,
	})
	tween(ring, 0.35, { Size = Vector3.new(0.05, 3.2, 3.2), Transparency = 1 })
	Debris:AddItem(ring, 0.4)
	playSound("Buff", 1.2 + math.random() * 0.4)
end

local function floatingText(position, text, color)
	local anchor = effectAnchor(position, nil, 1.4)
	local gui = Instance.new("BillboardGui")
	gui.Size = UDim2.fromOffset(140, 44)
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.Adornee = anchor
	gui.ResetOnSpawn = false
	gui.Parent = playerGui
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.Text = text
	label.TextScaled = true
	label.TextColor3 = color
	label.Parent = gui
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 2.5
	stroke.Color = INK
	stroke.Parent = label
	tween(gui, 1.2, { StudsOffsetWorldSpace = Vector3.new(0, 4, 0) }, Enum.EasingStyle.Quad)
	task.delay(0.6, function()
		tween(label, 0.6, { TextTransparency = 1 })
		tween(stroke, 0.6, { Transparency = 1 })
	end)
	Debris:AddItem(gui, 1.3)
end

local function coinExplosion(position)
	local flashAnchor = effectAnchor(position, Vector3.yAxis, 3)
	local light = Instance.new("PointLight")
	light.Color = GOLD
	light.Range = 18
	light.Brightness = 6
	light.Parent = flashAnchor
	tween(light, 1.2, { Brightness = 0 })
	emitter(flashAnchor, {
		Texture = TEXTURES.Sparkle,
		Color = ColorSequence.new(GOLD, Color3.fromRGB(255, 255, 200)),
		Size = NumberSequence.new(1.2, 0),
		Lifetime = NumberRange.new(0.6, 1.2),
		Speed = NumberRange.new(8, 20),
		SpreadAngle = Vector2.new(180, 180),
		LightEmission = 1,
		EmissionDirection = Enum.NormalId.Top,
	}):Emit(60)

	for index = 1, 32 do
		local coin = localPart({
			Name = "Coin",
			Shape = Enum.PartType.Cylinder,
			Size = Vector3.new(0.18, 1, 1),
			CFrame = CFrame.new(position + Vector3.new(math.random(-10, 10) / 10, 0, math.random(-10, 10) / 10))
				* CFrame.Angles(math.random() * 6, math.random() * 6, math.random() * 6),
			Color = GOLD,
			Material = Enum.Material.Metal,
			Reflectance = 0.35,
			Anchored = false,
			CanCollide = true,
			CollisionGroup = "DetailingFX",
		})
		coin.AssemblyLinearVelocity = Vector3.new(math.random(-16, 16), math.random(24, 42), math.random(-16, 16))
		coin.AssemblyAngularVelocity = Vector3.new(math.random(-20, 20), math.random(-20, 20), math.random(-20, 20))
		task.delay(1.6 + index * 0.02, function()
			if coin.Parent then
				tween(coin, 0.6, { Transparency = 1, Size = Vector3.new(0.05, 0.3, 0.3) })
			end
		end)
		Debris:AddItem(coin, 2.6)
	end
end

local function showPayoutBanner(amount)
	bannerAmount.Text = "+" .. formatMoney(amount)
	banner.Visible = true
	bannerScale.Scale = 0.3
	tween(bannerScale, 0.45, { Scale = 1 }, Enum.EasingStyle.Back)
	task.delay(2.4, function()
		tween(bannerScale, 0.25, { Scale = 0 }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
		task.wait(0.3)
		banner.Visible = false
	end)
end

--------------------------------------------------------------------------------
-- TOOL INPUT  (camera-to-surface raycasts, hold to keep working)
--------------------------------------------------------------------------------

local Equipped = { Tool = nil, ToolId = nil, Holding = false, LastFire = 0 }
local pointer = { Kind = "Mouse", Position = nil }

UserInputService.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.Touch then
		pointer.Kind = "Touch"
		pointer.Position = input.Position
	elseif input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.MouseMovement then
		pointer.Kind = "Mouse"
	elseif input.UserInputType == Enum.UserInputType.Gamepad1 then
		pointer.Kind = "Gamepad"
	end
end)
UserInputService.InputChanged:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.Touch then
		pointer.Kind = "Touch"
		pointer.Position = input.Position
	elseif input.UserInputType == Enum.UserInputType.MouseMovement then
		pointer.Kind = "Mouse"
	end
end)

local function pointerRay()
	if pointer.Kind == "Touch" and pointer.Position then
		return camera:ScreenPointToRay(pointer.Position.X, pointer.Position.Y)
	elseif pointer.Kind == "Mouse" and UserInputService.MouseEnabled then
		local mouse = UserInputService:GetMouseLocation()
		return camera:ViewportPointToRay(mouse.X, mouse.Y)
	end
	local viewport = camera.ViewportSize
	return camera:ViewportPointToRay(viewport.X / 2, viewport.Y / 2)
end

local function surfaceRaycast()
	local ray = pointerRay()
	local exclude = { fxFolder }
	for _, other in Players:GetPlayers() do
		if other.Character then
			table.insert(exclude, other.Character)
		end
	end
	local world = getWorld()
	if world then
		for _, name in { "Vans", "Customers" } do
			local folder = world:FindFirstChild(name)
			if folder then
				table.insert(exclude, folder)
			end
		end
	end
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = exclude
	params.IgnoreWater = true
	return Workspace:Raycast(ray.Origin, ray.Direction * 250, params), ray.Origin
end

local function comboText(layerId)
	local layer = Catalogue and Catalogue.Layers[layerId]
	if not layer then
		return "That needs a different tool."
	end
	return ("%s needs %s + %s"):format(layer.DisplayName, Catalogue.Tools[layer.Tool].DisplayName, Catalogue.Chemicals[layer.Chemical].DisplayName)
end

local function comboMatches(layerId)
	local layer = Catalogue and Catalogue.Layers[layerId]
	if not layer or not Snapshot or not Equipped.ToolId then
		return false
	end
	return layer.Tool == Equipped.ToolId and Snapshot.ChemicalLoadout[Equipped.ToolId] == layer.Chemical
end

local function nozzleOf(tool)
	local handle = tool and tool:FindFirstChild("Handle")
	return handle and handle:FindFirstChild("Nozzle")
end

local function fireTool()
	local tool = Equipped.Tool
	if not tool or not Catalogue or not Snapshot then
		return
	end
	Equipped.LastFire = os.clock()
	local result, origin = surfaceRaycast()
	if not result then
		return
	end
	local part = result.Instance
	local layerId = part:GetAttribute("DirtLayer")
	local root = getRoot()
	if not layerId then
		-- Nothing to treat: a little puff so the tool still feels alive.
		if root and (root.Position - result.Position).Magnitude <= Catalogue.ToolRange then
			local effect = TOOL_EFFECTS[Equipped.ToolId]
			if effect and Equipped.ToolId == "HighPressureWasher" then
				effect(result.Position, result.Normal, nozzleOf(tool), false)
			end
		end
		return
	end
	if not root or (root.Position - result.Position).Magnitude > Catalogue.ToolRange then
		showHint("Move closer to the car.")
		return
	end
	if not comboMatches(layerId) then
		showHint(comboText(layerId), Color3.fromRGB(200, 60, 60))
		playSound("Reject", 0.8)
		return
	end
	-- Predict the effect now; the server decides whether it counted.
	local effect = TOOL_EFFECTS[Equipped.ToolId]
	if effect then
		effect(result.Position, result.Normal, nozzleOf(tool), false)
	end
	CleanCarEvent:FireServer(part, result.Position, origin)
end

local function interval()
	local def = Catalogue and Equipped.ToolId and Catalogue.Tools[Equipped.ToolId]
	return if def then def.FireInterval else 0.2
end

RunService.Heartbeat:Connect(function()
	if Equipped.Holding and Equipped.Tool and os.clock() - Equipped.LastFire >= interval() then
		fireTool()
	end
end)

local toolConnections = {}
local function watchTool(tool)
	if toolConnections[tool] or not tool:IsA("Tool") or not tool:GetAttribute("ToolId") then
		return
	end
	toolConnections[tool] = {
		tool.Equipped:Connect(function()
			Equipped.Tool = tool
			Equipped.ToolId = tool:GetAttribute("ToolId")
		end),
		tool.Unequipped:Connect(function()
			if Equipped.Tool == tool then
				Equipped.Tool = nil
				Equipped.ToolId = nil
				Equipped.Holding = false
			end
		end),
		tool.Activated:Connect(function()
			Equipped.Holding = true
			if os.clock() - Equipped.LastFire >= interval() then
				fireTool()
			end
		end),
		tool.Deactivated:Connect(function()
			Equipped.Holding = false
		end),
		tool.AncestryChanged:Connect(function(_, parent)
			if parent == nil then
				for _, connection in toolConnections[tool] or {} do
					connection:Disconnect()
				end
				toolConnections[tool] = nil
			end
		end),
	}
	if tool.Parent and tool.Parent == player.Character then
		Equipped.Tool = tool
		Equipped.ToolId = tool:GetAttribute("ToolId")
	end
end

local function watchContainer(container)
	if not container then
		return
	end
	for _, child in container:GetChildren() do
		watchTool(child)
	end
	container.ChildAdded:Connect(watchTool)
end

player.CharacterAdded:Connect(function(character)
	Equipped.Tool = nil
	Equipped.ToolId = nil
	Equipped.Holding = false
	watchContainer(character)
	watchContainer(player:WaitForChild("Backpack", 10))
end)
if player.Character then
	watchContainer(player.Character)
	watchContainer(player:FindFirstChildOfClass("Backpack"))
end

-- Hover outline: green if the equipped tool + chemical fits, red if not.
local hoverHighlight = Instance.new("Highlight")
hoverHighlight.Name = "DirtHover"
hoverHighlight.FillTransparency = 1
hoverHighlight.OutlineTransparency = 0
hoverHighlight.DepthMode = Enum.HighlightDepthMode.Occluded
hoverHighlight.Enabled = false
hoverHighlight.Parent = fxFolder

local hoverGui = Instance.new("BillboardGui")
hoverGui.Name = "DirtTooltip"
hoverGui.Size = UDim2.fromOffset(300, 40)
hoverGui.StudsOffsetWorldSpace = Vector3.new(0, 2.2, 0)
hoverGui.AlwaysOnTop = true
hoverGui.LightInfluence = 0
hoverGui.Enabled = false
hoverGui.ResetOnSpawn = false
hoverGui.Parent = playerGui
local hoverLabel = Instance.new("TextLabel")
hoverLabel.Size = UDim2.fromScale(1, 1)
hoverLabel.BackgroundColor3 = INK
hoverLabel.BackgroundTransparency = 0.15
hoverLabel.Font = Enum.Font.GothamBold
hoverLabel.TextScaled = true
hoverLabel.TextColor3 = Color3.new(1, 1, 1)
hoverLabel.Parent = hoverGui
do
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 10)
	corner.Parent = hoverLabel
	local padding = Instance.new("UIPadding")
	padding.PaddingLeft = UDim.new(0, 8)
	padding.PaddingRight = UDim.new(0, 8)
	padding.Parent = hoverLabel
end

local hoverClock = 0
RunService.Heartbeat:Connect(function(dt)
	hoverClock += dt
	if hoverClock < 0.1 then
		return
	end
	hoverClock = 0
	if not Equipped.Tool or not Catalogue then
		hoverHighlight.Enabled = false
		hoverGui.Enabled = false
		return
	end
	local result = surfaceRaycast()
	local part = result and result.Instance
	local layerId = part and part:GetAttribute("DirtLayer")
	if not layerId then
		hoverHighlight.Enabled = false
		hoverGui.Enabled = false
		return
	end
	local fits = comboMatches(layerId)
	hoverHighlight.Adornee = part
	hoverHighlight.OutlineColor = if fits then NEON_GREEN else Color3.fromRGB(255, 70, 70)
	hoverHighlight.Enabled = true
	hoverGui.Adornee = part
	hoverGui.Enabled = true
	local layer = Catalogue.Layers[layerId]
	hoverLabel.Text = if fits
		then ("✅ %s  •  +%s a hit"):format(layer.DisplayName, formatMoney(layer.Value * (Snapshot.PayoutMultiplier or 1)))
		else "❌ " .. comboText(layerId)
end)

--------------------------------------------------------------------------------
-- SERVER RESULTS FOR HITS
--------------------------------------------------------------------------------

CleanCarEvent.OnClientEvent:Connect(function(result)
	if type(result) ~= "table" then
		return
	end
	if result.Ok then
		floatingText(result.Position, "+" .. formatMoney(result.Gain), CASH_GREEN)
		if result.Cleared then
			local effect = TOOL_EFFECTS[Equipped.ToolId or ""]
			if effect then
				effect(result.Position, result.Normal or Vector3.yAxis, nil, true)
			end
			playSound("Cleared", 1 + (result.Percent or 0) / 200)
		end
		if Snapshot and Snapshot.ActiveJob then
			Snapshot.ActiveJob.Bill = result.Bill
		end
	elseif result.Reason == "WrongCombo" then
		showHint(comboText(result.Layer), Color3.fromRGB(200, 60, 60))
		playSound("Reject", 0.8)
	elseif REJECT_TEXT[result.Reason] then
		showHint(REJECT_TEXT[result.Reason])
	end
end)

--------------------------------------------------------------------------------
-- LIVE BILLING BILLBOARDS  (one over the roof of every customer car)
--------------------------------------------------------------------------------

local STATUS_TEXT = {
	Arriving = "🚗 Arriving...",
	Washing = "🧽 In the wash bay",
	ToPickup = "✨ Spotless! Moving to pick-up",
	CustomerWalking = "🚶 Customer on the way",
	AwaitingPayment = "💰 Awaiting payment",
	Paid = "✅ Paid. Thank you!",
	Departing = "👋 Heading home",
}

local function attachBillboard(model)
	local roof = model:WaitForChild("Roof", 10)
	if not roof or not model.Parent then
		return
	end
	local isMine = model:GetAttribute("OwnerUserId") == player.UserId

	local gui = Instance.new("BillboardGui")
	gui.Name = "BillingBoard"
	gui.Adornee = roof
	gui.Size = UDim2.fromOffset(250, 104)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 4.5, 0)
	gui.AlwaysOnTop = isMine
	gui.MaxDistance = if isMine then 200 else 70
	gui.LightInfluence = 0
	gui.ResetOnSpawn = false
	gui.Parent = playerGui

	local card = Instance.new("Frame")
	card.Size = UDim2.fromScale(1, 1)
	card.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	card.Parent = gui
	local cardScale = Instance.new("UIScale")
	cardScale.Parent = card
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 16)
	corner.Parent = card
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 3
	stroke.Color = INK
	stroke.Parent = card

	local header = Instance.new("TextLabel")
	header.Position = UDim2.fromOffset(10, 6)
	header.Size = UDim2.new(1, -20, 0, 22)
	header.BackgroundTransparency = 1
	header.Font = Enum.Font.GothamBold
	header.TextScaled = true
	header.TextXAlignment = Enum.TextXAlignment.Left
	header.TextColor3 = INK
	header.Text = ("🧾 %s's car"):format(model:GetAttribute("CustomerName") or "Customer")
	header.Parent = card

	local amount = Instance.new("TextLabel")
	amount.Position = UDim2.fromOffset(10, 28)
	amount.Size = UDim2.new(1, -20, 0, 40)
	amount.BackgroundTransparency = 1
	amount.Font = Enum.Font.FredokaOne
	amount.TextScaled = true
	amount.TextXAlignment = Enum.TextXAlignment.Left
	amount.TextColor3 = Color3.fromRGB(30, 170, 80)
	amount.Text = "Current Bill: £0"
	amount.Parent = card

	local barBack = Instance.new("Frame")
	barBack.Position = UDim2.new(0, 10, 1, -30)
	barBack.Size = UDim2.new(1, -20, 0, 20)
	barBack.BackgroundColor3 = Color3.fromRGB(225, 232, 245)
	barBack.Parent = card
	local barCorner = Instance.new("UICorner")
	barCorner.CornerRadius = UDim.new(1, 0)
	barCorner.Parent = barBack
	local barFill = Instance.new("Frame")
	barFill.Size = UDim2.fromScale(0, 1)
	barFill.BackgroundColor3 = Color3.fromRGB(70, 210, 90)
	barFill.Parent = barBack
	barCorner:Clone().Parent = barFill
	local barText = Instance.new("TextLabel")
	barText.Size = UDim2.fromScale(1, 1)
	barText.BackgroundTransparency = 1
	barText.Font = Enum.Font.GothamBold
	barText.TextScaled = true
	barText.TextColor3 = INK
	barText.ZIndex = 2
	barText.Parent = barBack

	local displayed = Instance.new("NumberValue")
	displayed.Value = 0
	displayed.Changed:Connect(function(value)
		amount.Text = "Current Bill: " .. formatMoney(value)
	end)

	local function refreshBill()
		local bill = model:GetAttribute("BillTotal") or 0
		if bill > displayed.Value then
			cardScale.Scale = 1.12
			tween(cardScale, 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
		end
		tween(displayed, 0.5, { Value = bill }, Enum.EasingStyle.Quad)
	end
	local function refreshStatus()
		local status = model:GetAttribute("Status") or "Arriving"
		local percent = model:GetAttribute("CleanPercent") or 0
		tween(barFill, 0.3, { Size = UDim2.fromScale(math.clamp(percent / 100, 0, 1), 1) })
		if status == "Washing" then
			barText.Text = ("Clean %d%%"):format(percent)
		else
			barText.Text = STATUS_TEXT[status] or status
		end
		if status == "AwaitingPayment" then
			stroke.Color = Color3.fromRGB(40, 200, 90)
		end
	end

	local connections = {
		model:GetAttributeChangedSignal("BillTotal"):Connect(refreshBill),
		model:GetAttributeChangedSignal("CleanPercent"):Connect(refreshStatus),
		model:GetAttributeChangedSignal("Status"):Connect(refreshStatus),
	}
	refreshBill()
	refreshStatus()

	model.AncestryChanged:Connect(function(_, parent)
		if parent == nil then
			for _, connection in connections do
				connection:Disconnect()
			end
			gui:Destroy()
		end
	end)
end

CollectionService:GetInstanceAddedSignal("CustomerVehicle"):Connect(function(model)
	task.spawn(attachBillboard, model)
end)
for _, model in CollectionService:GetTagged("CustomerVehicle") do
	task.spawn(attachBillboard, model)
end

--------------------------------------------------------------------------------
-- PAYOUT: the pulsing "Collect Payout!" indicator and the cha-ching
--------------------------------------------------------------------------------

local Payout = { JobId = nil, Gui = nil, Pulse = nil, Bound = false }

local function claimPayout()
	if Payout.JobId then
		ClaimPaymentEvent:FireServer(Payout.JobId)
	end
end

local function clearPayoutIndicator()
	if Payout.Pulse then
		Payout.Pulse:Cancel()
	end
	if Payout.Gui then
		Payout.Gui:Destroy()
	end
	if Payout.Bound then
		ContextActionService:UnbindAction("CollectPayout")
	end
	Payout.JobId = nil
	Payout.Gui = nil
	Payout.Pulse = nil
	Payout.Bound = false
end

local function showPayoutIndicator(jobId, amount)
	clearPayoutIndicator()
	local anchor = getMarker("PayoutAnchor")
	if not anchor then
		return
	end
	Payout.JobId = jobId

	local gui = Instance.new("BillboardGui")
	gui.Name = "CollectPayout"
	gui.Adornee = anchor
	gui.Size = UDim2.fromOffset(240, 92)
	gui.AlwaysOnTop = true
	gui.Active = true
	gui.LightInfluence = 0
	gui.ResetOnSpawn = false
	gui.Parent = playerGui

	local button = Instance.new("TextButton")
	button.Size = UDim2.fromScale(1, 1)
	button.BackgroundColor3 = Color3.fromRGB(60, 210, 90)
	button.AutoButtonColor = false
	button.Text = ""
	button.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 20)
	corner.Parent = button
	local stroke = Instance.new("UIStroke")
	stroke.Thickness = 4
	stroke.Color = Color3.fromRGB(20, 110, 50)
	stroke.Parent = button
	local gradient = Instance.new("UIGradient")
	gradient.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), Color3.fromRGB(190, 190, 190))
	gradient.Rotation = 90
	gradient.Parent = button
	local scale = Instance.new("UIScale")
	scale.Parent = button

	local title = Instance.new("TextLabel")
	title.Position = UDim2.fromScale(0.05, 0.08)
	title.Size = UDim2.fromScale(0.9, 0.5)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.FredokaOne
	title.Text = "💰 Collect Payout!"
	title.TextScaled = true
	title.TextColor3 = Color3.new(1, 1, 1)
	title.Parent = button
	local amountLabel = Instance.new("TextLabel")
	amountLabel.Position = UDim2.fromScale(0.05, 0.56)
	amountLabel.Size = UDim2.fromScale(0.9, 0.36)
	amountLabel.BackgroundTransparency = 1
	amountLabel.Font = Enum.Font.FredokaOne
	amountLabel.Text = formatMoney(amount)
	amountLabel.TextScaled = true
	amountLabel.TextColor3 = Color3.fromRGB(255, 240, 140)
	amountLabel.Parent = button
	for _, label in { title, amountLabel } do
		local textStroke = Instance.new("UIStroke")
		textStroke.Thickness = 2.5
		textStroke.Color = Color3.fromRGB(20, 90, 40)
		textStroke.Parent = label
	end

	Payout.Pulse = TweenService:Create(scale, TweenInfo.new(0.55, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), { Scale = 1.12 })
	Payout.Pulse:Play()
	button.Activated:Connect(claimPayout)
	Payout.Gui = gui
end

-- Keyboard / gamepad / touch button when standing near the desk.
RunService.Heartbeat:Connect(function()
	if not Payout.JobId then
		return
	end
	local anchor = getMarker("PayoutAnchor")
	local root = getRoot()
	local near = anchor and root and Catalogue and (root.Position - anchor.Position).Magnitude <= Catalogue.PayoutRange
	if near and not Payout.Bound then
		Payout.Bound = true
		ContextActionService:BindAction("CollectPayout", function(_, state)
			if state == Enum.UserInputState.Begin then
				claimPayout()
			end
			return Enum.ContextActionResult.Sink
		end, true, Enum.KeyCode.E, Enum.KeyCode.ButtonX)
		ContextActionService:SetTitle("CollectPayout", "Collect")
	elseif not near and Payout.Bound then
		Payout.Bound = false
		ContextActionService:UnbindAction("CollectPayout")
	end
end)

ClaimPaymentEvent.OnClientEvent:Connect(function(message)
	if type(message) ~= "table" then
		return
	end
	if message.Action == "Ready" then
		showPayoutIndicator(message.JobId, message.Amount or 0)
		playSound("Cleared", 1.5)
	elseif message.Action == "Paid" then
		clearPayoutIndicator()
		playChaChing()
		coinExplosion(message.Position + Vector3.new(0, 1, 0))
		showPayoutBanner(message.Amount or 0)
		playPayoutCamera(message.Position)
	end
end)

--------------------------------------------------------------------------------
-- SNAPSHOT, QUEST EVENTS, KIT PROMPT
--------------------------------------------------------------------------------

local introPlayed = false

-- Drive prompts: only the owner sees theirs, and not while already seated.
local promptClock = 0
RunService.Heartbeat:Connect(function(dt)
	promptClock += dt
	if promptClock < 0.25 then
		return
	end
	promptClock = 0
	local world = getWorld()
	local vans = world and world:FindFirstChild("Vans")
	if not vans then
		return
	end
	local humanoid = getHumanoid()
	local seated = humanoid ~= nil and humanoid.SeatPart ~= nil
	for _, van in vans:GetChildren() do
		local seat = van:FindFirstChild("DriverSeat")
		local prompt = seat and seat:FindFirstChild("DrivePrompt")
		if prompt then
			prompt.Enabled = prompt:GetAttribute("OwnerUserId") == player.UserId and not seated
		end
	end
end)

local function updateKitPrompt()
	local store = getStore()
	local button = store and store:FindFirstChild("KitButton")
	if not button or not Snapshot then
		return
	end
	local active = Snapshot.TutorialStep == 2
	local prompt = button:FindFirstChildOfClass("ProximityPrompt")
	if prompt then
		prompt.Enabled = active
	end
	local board = button:FindFirstChild("KitBillboard")
	if board then
		board.Enabled = Snapshot.TutorialStep <= 2
	end
end

local function applySnapshot(snapshot)
	if type(snapshot) ~= "table" then
		return
	end
	Snapshot = snapshot
	updateKitPrompt()
	if not introPlayed and snapshot.TutorialStep == 1 then
		introPlayed = true
		task.spawn(playIntro)
	end
	introPlayed = true
	-- Recover a lost payout indicator (e.g. after a respawn).
	local job = snapshot.ActiveJob
	if job and job.Status == "AwaitingPayment" then
		if Payout.JobId ~= job.Id then
			showPayoutIndicator(job.Id, job.Bill)
		end
	elseif Payout.JobId then
		clearPayoutIndicator()
	end
end

DataSyncEvent.OnClientEvent:Connect(applySnapshot)

QuestEvent.OnClientEvent:Connect(function(message)
	if type(message) ~= "table" then
		return
	end
	if message.Action == "Stage" and Snapshot then
		Snapshot.TutorialStep = message.Step
		updateKitPrompt()
	elseif message.Action == "NameResult" and message.Ok then
		task.spawn(playBrandingReveal, message.Name or "Your company")
	elseif message.Action == "KitCollected" then
		local root = getRoot()
		if root then
			local anchor = effectAnchor(root.Position, Vector3.yAxis, 3)
			emitter(anchor, {
				Texture = TEXTURES.Sparkle,
				Color = ColorSequence.new(GOLD, Color3.fromRGB(255, 255, 255)),
				Size = NumberSequence.new(0.9, 0),
				Lifetime = NumberRange.new(0.6, 1.2),
				Speed = NumberRange.new(6, 14),
				SpreadAngle = Vector2.new(180, 180),
				LightEmission = 1,
			}):Emit(50)
		end
		playChaChing()
	end
end)

--------------------------------------------------------------------------------
-- STARTUP
--------------------------------------------------------------------------------

task.spawn(function()
	while not Catalogue do
		local ok, result = pcall(SnapshotFunction.InvokeServer, SnapshotFunction, "Catalogue")
		if ok and type(result) == "table" then
			Catalogue = result
		else
			task.wait(1)
		end
	end
	for _ = 1, 120 do
		if Snapshot then
			break
		end
		local ok, result = pcall(SnapshotFunction.InvokeServer, SnapshotFunction)
		if ok and type(result) == "table" then
			applySnapshot(result)
			break
		end
		task.wait(1)
	end
end)
