--!nonstrict
--[[
	InterfaceController  ·  Car Detailing Tycoon
	LocalScript  ->  StarterGui.DetailingUI   (DetailingUI is a ScreenGui;
	                                           set its ResetOnSpawn to false)

	Every screen-space panel, built in code so nothing has to be laid out by
	hand, and scaled to the device so it reads the same on a phone, a tablet,
	a laptop and a TV.

	  · HUD: animated cash counter, quest tracker, toasts, phone and
	    customise buttons, the equipment bar with its chemical picker.
	  · Company Naming modal with a live sign preview.
	  · Starter-kit reward card.
	  · Virtual smartphone: Home, Ads, Supplies, Upgrades and Van apps.
	  · Van Upgrades panel: Sign Writing, Paint Shop, Interior Layout grid.

	The UI only ever asks. Prices on buttons come from the server catalogue,
	and every purchase is re-checked on the server.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local SoundService = game:GetService("SoundService")
local Debris = game:GetService("Debris")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local camera = Workspace.CurrentCamera

--------------------------------------------------------------------------------
-- SCREEN GUI  (tolerates a missing ScreenGui and never runs twice)
--------------------------------------------------------------------------------

local screenGui = script.Parent
if not screenGui:IsA("ScreenGui") then
	screenGui = Instance.new("ScreenGui")
	screenGui.Name = "DetailingUI"
	screenGui.Parent = playerGui
end
local existing = playerGui:FindFirstChild("DetailingUI_Live")
if existing and existing ~= screenGui then
	-- A respawn re-cloned the StarterGui copy; the live one keeps running.
	if script.Parent == screenGui then
		screenGui:Destroy()
	end
	return
end
screenGui.Name = "DetailingUI_Live"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = false
screenGui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.DisplayOrder = 10

local NetworkEvents = ReplicatedStorage:WaitForChild("NetworkEvents")
local UpgradeVanEvent = NetworkEvents:WaitForChild("UpgradeVanEvent")
local QuestEvent = NetworkEvents:WaitForChild("QuestEvent")
local CommerceEvent = NetworkEvents:WaitForChild("CommerceEvent")
local NotifyEvent = NetworkEvents:WaitForChild("NotifyEvent")
local DataSyncEvent = NetworkEvents:WaitForChild("DataSyncEvent")
local SnapshotFunction = NetworkEvents:WaitForChild("SnapshotFunction")

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

local CinematicSignal = getSignal("Cinematic")
local CameraFocusSignal = getSignal("CameraFocus")
local ToastSignal = getSignal("Toast")

--------------------------------------------------------------------------------
-- THEME AND BUILDING BLOCKS
--------------------------------------------------------------------------------

local THEME = {
	Title = Enum.Font.FredokaOne,
	Body = Enum.Font.GothamBold,
	Ink = Color3.fromRGB(28, 38, 72),
	Card = Color3.fromRGB(255, 255, 255),
	CardAlt = Color3.fromRGB(236, 244, 255),
	Muted = Color3.fromRGB(120, 130, 160),
	Sky = Color3.fromRGB(64, 170, 255),
	SkyDark = Color3.fromRGB(30, 110, 220),
	Green = Color3.fromRGB(70, 205, 90),
	GreenDark = Color3.fromRGB(30, 140, 60),
	Yellow = Color3.fromRGB(255, 200, 50),
	YellowDark = Color3.fromRGB(205, 140, 10),
	Red = Color3.fromRGB(255, 85, 85),
	RedDark = Color3.fromRGB(190, 40, 50),
	Purple = Color3.fromRGB(150, 95, 235),
	Grey = Color3.fromRGB(175, 182, 198),
	White = Color3.fromRGB(255, 255, 255),
}

local UI_SOUNDS = {
	Click = { Id = "rbxasset://sounds/clickfast.wav", Volume = 0.5 },
	Whoosh = { Id = "rbxasset://sounds/swoosh.wav", Volume = 0.4 },
	Success = { Id = "rbxasset://sounds/electronicpingshort.wav", Volume = 0.45 },
	Error = { Id = "rbxasset://sounds/button.wav", Volume = 0.5 },
}

local uiSounds = {}
for key, spec in UI_SOUNDS do
	local sound = Instance.new("Sound")
	sound.Name = "DetailingUI_" .. key
	sound.SoundId = spec.Id
	sound.Volume = spec.Volume
	sound.Parent = SoundService
	uiSounds[key] = sound
end

local function playUiSound(key, pitch)
	local template = uiSounds[key]
	if not template then
		return
	end
	local sound = template:Clone()
	sound.PlaybackSpeed = pitch or 1
	sound.Parent = SoundService
	sound:Play()
	Debris:AddItem(sound, 3)
end

local function make(className, props, children)
	local instance = Instance.new(className)
	for key, value in props or {} do
		if key ~= "Parent" then
			(instance :: any)[key] = value
		end
	end
	for _, child in children or {} do
		child.Parent = instance
	end
	if props and props.Parent then
		instance.Parent = props.Parent
	end
	return instance
end

local function corner(radius)
	return make("UICorner", { CornerRadius = if radius then UDim.new(0, radius) else UDim.new(1, 0) })
end

local function borderStroke(color, thickness)
	return make("UIStroke", { Color = color or THEME.Ink, Thickness = thickness or 3, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

local function textStroke(color, thickness)
	return make("UIStroke", { Color = color or THEME.Ink, Thickness = thickness or 2 })
end

local function padding(top, right, bottom, left)
	return make("UIPadding", {
		PaddingTop = UDim.new(0, top),
		PaddingRight = UDim.new(0, right or top),
		PaddingBottom = UDim.new(0, bottom or top),
		PaddingLeft = UDim.new(0, left or right or top),
	})
end

local function shine()
	return make("UIGradient", { Color = ColorSequence.new(Color3.fromRGB(255, 255, 255), Color3.fromRGB(205, 205, 210)), Rotation = 90 })
end

local function listLayout(direction, gap, align)
	return make("UIListLayout", {
		FillDirection = direction or Enum.FillDirection.Vertical,
		Padding = UDim.new(0, gap or 8),
		SortOrder = Enum.SortOrder.LayoutOrder,
		HorizontalAlignment = align or Enum.HorizontalAlignment.Center,
	})
end

local function label(props)
	local text = make("TextLabel", {
		BackgroundTransparency = 1,
		Font = props.Font or THEME.Title,
		Text = props.Text or "",
		TextColor3 = props.Color or THEME.Ink,
		TextScaled = props.TextSize == nil,
		TextSize = props.TextSize or 14,
		TextWrapped = true,
		TextXAlignment = props.AlignX or Enum.TextXAlignment.Center,
		TextYAlignment = props.AlignY or Enum.TextYAlignment.Center,
		Size = props.Size or UDim2.fromScale(1, 1),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
		LayoutOrder = props.LayoutOrder or 0,
		ZIndex = props.ZIndex or 1,
		AutomaticSize = props.AutomaticSize or Enum.AutomaticSize.None,
		RichText = props.RichText == true,
		Name = props.Name or "Label",
		Parent = props.Parent,
	})
	if props.Stroke then
		textStroke(props.Stroke, props.StrokeThickness).Parent = text
	end
	if props.MaxTextSize then
		make("UITextSizeConstraint", { MaxTextSize = props.MaxTextSize, Parent = text })
	end
	return text
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

-- Chunky, bouncy button in the house style. Returns the button and a setter
-- for its enabled state and caption.
local function button(props)
	local base = props.Color or THEME.Green
	local holder = make("TextButton", {
		Name = props.Name or "Button",
		AutoButtonColor = false,
		BackgroundColor3 = base,
		Text = "",
		Size = props.Size or UDim2.fromOffset(160, 48),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
		LayoutOrder = props.LayoutOrder or 0,
		ZIndex = props.ZIndex or 1,
		Parent = props.Parent,
	})
	corner(props.Radius or 14).Parent = holder
	borderStroke(THEME.Ink, props.StrokeThickness or 3).Parent = holder
	shine().Parent = holder
	local scale = make("UIScale", { Parent = holder })
	local caption = label({
		Text = props.Text or "",
		Color = THEME.White,
		Stroke = THEME.Ink,
		StrokeThickness = 2,
		Size = UDim2.new(1, -14, 1, -10),
		Position = UDim2.fromScale(0.5, 0.5),
		AnchorPoint = Vector2.new(0.5, 0.5),
		MaxTextSize = props.MaxTextSize or 28,
		ZIndex = (props.ZIndex or 1) + 1,
		Parent = holder,
	})
	local enabled = true
	holder.MouseEnter:Connect(function()
		if enabled then
			tween(scale, 0.12, { Scale = 1.05 })
		end
	end)
	holder.MouseLeave:Connect(function()
		tween(scale, 0.12, { Scale = 1 })
	end)
	holder.Activated:Connect(function()
		if not enabled then
			playUiSound("Error", 0.8)
			return
		end
		playUiSound("Click", 1.1)
		scale.Scale = 0.9
		tween(scale, 0.25, { Scale = 1 }, Enum.EasingStyle.Back)
		if props.OnClick then
			props.OnClick()
		end
	end)
	local controls = {}
	function controls.SetEnabled(isEnabled)
		enabled = isEnabled
		holder.BackgroundColor3 = if isEnabled then base else THEME.Grey
	end
	function controls.SetText(text)
		caption.Text = text
	end
	function controls.SetColor(color)
		base = color
		if enabled then
			holder.BackgroundColor3 = color
		end
	end
	return holder, controls
end

local function card(props)
	local frame = make("Frame", {
		Name = props.Name or "Card",
		BackgroundColor3 = props.Color or THEME.Card,
		Size = props.Size or UDim2.fromOffset(200, 100),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
		LayoutOrder = props.LayoutOrder or 0,
		AutomaticSize = props.AutomaticSize or Enum.AutomaticSize.None,
		Visible = props.Visible ~= false,
		ZIndex = props.ZIndex or 1,
		Parent = props.Parent,
	})
	corner(props.Radius or 18).Parent = frame
	borderStroke(props.StrokeColor or THEME.Ink, props.StrokeThickness or 3).Parent = frame
	return frame
end

local function formatMoney(amount)
	local whole = tostring(math.floor((amount or 0) + 0.5))
	local formatted = whole:reverse():gsub("(%d%d%d)", "%1,"):reverse()
	if formatted:sub(1, 1) == "," then
		formatted = formatted:sub(2)
	end
	return "£" .. formatted
end

local function sortedIds(dictionary)
	local ids = {}
	for id in dictionary do
		table.insert(ids, id)
	end
	table.sort(ids, function(a, b)
		local orderA = dictionary[a].Order or 0
		local orderB = dictionary[b].Order or 0
		if orderA == orderB then
			return a < b
		end
		return orderA < orderB
	end)
	return ids
end

--------------------------------------------------------------------------------
-- RESPONSIVE SCALE
--------------------------------------------------------------------------------

local root = make("Frame", { Name = "Root", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = screenGui })

local scaleObjects = {}
local currentScale = 1

local function computeScale()
	local viewport = camera.ViewportSize
	if viewport.X < 2 or viewport.Y < 2 then
		return 1
	end
	local scale = math.min(viewport.X / 1280, viewport.Y / 760)
	if UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled then
		scale *= 1.15 -- fingers need bigger targets
	end
	return math.clamp(scale, 0.5, 1.35)
end

local function isPortrait()
	local viewport = camera.ViewportSize
	return viewport.Y > viewport.X
end

local layoutListeners = {}

local function refreshScale()
	currentScale = computeScale()
	for _, uiScale in scaleObjects do
		uiScale.Scale = currentScale
	end
	for _, listener in layoutListeners do
		listener()
	end
end

-- Every top-level panel gets one of these; animations use a second, inner UIScale.
local function responsive(guiObject)
	local uiScale = make("UIScale", { Name = "ResponsiveScale", Scale = currentScale, Parent = guiObject })
	table.insert(scaleObjects, uiScale)
	return uiScale
end

camera:GetPropertyChangedSignal("ViewportSize"):Connect(refreshScale)
refreshScale()

--------------------------------------------------------------------------------
-- STATE
--------------------------------------------------------------------------------

local Catalogue = nil
local Snapshot = nil
local cinematicActive = false
local refreshers = {} -- functions re-run on every snapshot

local function refreshAll()
	if not Snapshot or not Catalogue then
		return
	end
	for _, refresh in refreshers do
		local ok, err = pcall(refresh)
		if not ok then
			warn("[InterfaceController] " .. tostring(err))
		end
	end
end

--------------------------------------------------------------------------------
-- TOASTS
--------------------------------------------------------------------------------

local toastHolder = make("Frame", {
	Name = "Toasts",
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 74),
	Size = UDim2.fromOffset(440, 260),
	BackgroundTransparency = 1,
	ZIndex = 40,
	Parent = root,
})
responsive(toastHolder)
listLayout(Enum.FillDirection.Vertical, 6).Parent = toastHolder

local TOAST_COLOURS = { success = THEME.Green, error = THEME.Red, info = THEME.Sky }
local toastOrder = 0

local function showToast(text, kind)
	if type(text) ~= "string" or text == "" then
		return
	end
	toastOrder += 1
	local toastFrame = card({
		Name = "Toast",
		Color = TOAST_COLOURS[kind] or THEME.Sky,
		Size = UDim2.fromOffset(420, 46),
		LayoutOrder = toastOrder,
		Radius = 23,
		ZIndex = 40,
		Parent = toastHolder,
	})
	shine().Parent = toastFrame
	local popScale = make("UIScale", { Scale = 0.6, Parent = toastFrame })
	label({
		Text = text,
		Color = THEME.White,
		Stroke = THEME.Ink,
		Font = THEME.Title,
		Size = UDim2.new(1, -24, 1, -10),
		Position = UDim2.fromScale(0.5, 0.5),
		AnchorPoint = Vector2.new(0.5, 0.5),
		MaxTextSize = 22,
		ZIndex = 41,
		Parent = toastFrame,
	})
	tween(popScale, 0.3, { Scale = 1 }, Enum.EasingStyle.Back)
	if kind == "error" then
		playUiSound("Error", 0.9)
	elseif kind == "success" then
		playUiSound("Success", 1.2)
	end

	local toasts = {}
	for _, child in toastHolder:GetChildren() do
		if child.Name == "Toast" then
			table.insert(toasts, child)
		end
	end
	if #toasts > 4 then
		table.sort(toasts, function(a, b)
			return a.LayoutOrder < b.LayoutOrder
		end)
		toasts[1]:Destroy()
	end

	task.delay(3.4, function()
		if toastFrame.Parent then
			tween(popScale, 0.25, { Scale = 0 }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
			task.wait(0.27)
			toastFrame:Destroy()
		end
	end)
end

NotifyEvent.OnClientEvent:Connect(showToast)
ToastSignal.Event:Connect(showToast)

--------------------------------------------------------------------------------
-- HUD: CASH
--------------------------------------------------------------------------------

local hud = make("Frame", { Name = "HUD", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Parent = root })

local cashPill = card({
	Name = "Cash",
	Color = THEME.Green,
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 10),
	Size = UDim2.fromOffset(240, 56),
	Radius = 28,
	Parent = hud,
})
responsive(cashPill)
shine().Parent = cashPill
local cashInner = make("Frame", {
	Name = "Inner",
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.5),
	Size = UDim2.fromScale(1, 1),
	BackgroundTransparency = 1,
	Parent = cashPill,
})
local cashBounce = make("UIScale", { Parent = cashInner })
label({ Text = "💷", Size = UDim2.fromOffset(46, 46), Position = UDim2.fromOffset(6, 5), Parent = cashInner })
local cashLabel = label({
	Text = "£0",
	Color = THEME.White,
	Stroke = THEME.Ink,
	StrokeThickness = 2.5,
	Size = UDim2.new(1, -66, 1, -12),
	Position = UDim2.fromOffset(56, 6),
	AlignX = Enum.TextXAlignment.Left,
	Parent = cashInner,
})
local cashShown = make("NumberValue", { Value = 0 })
cashShown.Changed:Connect(function(value)
	cashLabel.Text = formatMoney(value)
end)

local lastCash = nil
local function updateCash()
	local cash = Snapshot.Cash
	if lastCash == nil then
		cashShown.Value = cash
	else
		tween(cashShown, 0.8, { Value = cash }, Enum.EasingStyle.Quart)
		if cash ~= lastCash then
			local gained = cash > lastCash
			cashBounce.Scale = if gained then 1.2 else 0.9
			tween(cashBounce, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
			local delta = label({
				Text = (if gained then "+" else "-") .. formatMoney(math.abs(cash - lastCash)),
				Color = if gained then Color3.fromRGB(150, 255, 160) else Color3.fromRGB(255, 150, 150),
				Stroke = THEME.Ink,
				Size = UDim2.fromOffset(200, 34),
				Position = UDim2.new(0.5, 0, 1, 4),
				AnchorPoint = Vector2.new(0.5, 0),
				ZIndex = 5,
				Parent = cashPill,
			})
			tween(delta, 1.1, { Position = UDim2.new(0.5, 0, 1, 40), TextTransparency = 1 })
			Debris:AddItem(delta, 1.2)
		end
	end
	lastCash = cash
end
table.insert(refreshers, updateCash)

--------------------------------------------------------------------------------
-- HUD: QUEST TRACKER
--------------------------------------------------------------------------------

local tracker = card({
	Name = "Tracker",
	AnchorPoint = Vector2.new(0, 0.5),
	Position = UDim2.new(0, 14, 0.4, 0),
	Size = UDim2.fromOffset(330, 132),
	Parent = hud,
})
responsive(tracker)
local trackerChip = card({
	Name = "Chip",
	Color = THEME.Sky,
	Position = UDim2.fromOffset(12, -14),
	Size = UDim2.fromOffset(200, 30),
	Radius = 15,
	Parent = tracker,
})
local trackerChipText = label({ Text = "STEP 1/7", Color = THEME.White, Stroke = THEME.Ink, Size = UDim2.new(1, -14, 1, -6), Position = UDim2.fromOffset(7, 3), Parent = trackerChip })
local trackerTitle = label({
	Text = "",
	Size = UDim2.new(1, -24, 0, 30),
	Position = UDim2.fromOffset(12, 20),
	AlignX = Enum.TextXAlignment.Left,
	Parent = tracker,
})
local trackerText = label({
	Text = "",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.new(1, -24, 0, 44),
	Position = UDim2.fromOffset(12, 52),
	AlignX = Enum.TextXAlignment.Left,
	AlignY = Enum.TextYAlignment.Top,
	MaxTextSize = 17,
	Parent = tracker,
})
local trackerSteps = make("Frame", {
	Name = "Steps",
	Size = UDim2.new(1, -24, 0, 12),
	Position = UDim2.new(0, 12, 1, -22),
	BackgroundTransparency = 1,
	Parent = tracker,
})
listLayout(Enum.FillDirection.Horizontal, 5, Enum.HorizontalAlignment.Left).Parent = trackerSteps
local stepDots = {}
for index = 1, 7 do
	local dot = make("Frame", { Size = UDim2.new(1 / 7, -5, 1, 0), BackgroundColor3 = THEME.CardAlt, LayoutOrder = index, Parent = trackerSteps })
	corner().Parent = dot
	stepDots[index] = dot
end

local lastStep = nil
local function updateTracker()
	local step = Snapshot.TutorialStep
	local stage = Catalogue.Stages[step]
	if step >= 7 then
		trackerChipText.Text = "🏆 TYCOON MODE"
		trackerChip.BackgroundColor3 = THEME.Yellow
		trackerTitle.Text = Snapshot.CompanyName ~= "" and Snapshot.CompanyName or "Your Business"
		local bonus = math.floor(((Snapshot.PayoutMultiplier or 1) - 1) * 100 + 0.5)
		trackerText.Text = ("Customers queued: %d  •  Jobs done: %d  •  Bonus +%d%%"):format(
			Snapshot.PendingCustomers,
			Snapshot.JobsCompleted,
			bonus
		)
	else
		trackerChipText.Text = ("STEP %d/7"):format(step)
		trackerChip.BackgroundColor3 = THEME.Sky
		trackerTitle.Text = stage.Title
		trackerText.Text = stage.Objective
	end
	for index, dot in stepDots do
		dot.BackgroundColor3 = if index < step or step >= 7 then THEME.Green elseif index == step then THEME.Yellow else THEME.CardAlt
	end
	if lastStep and step ~= lastStep then
		local flash = make("UIScale", { Scale = 1.08, Parent = trackerTitle })
		tween(flash, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
		Debris:AddItem(flash, 0.5)
		playUiSound("Success", 1.4)
	end
	lastStep = step
end
table.insert(refreshers, updateTracker)

--------------------------------------------------------------------------------
-- HUD: EQUIPMENT BAR  (equipped tool, loaded chemical, what the combo treats)
--------------------------------------------------------------------------------

local equippedToolId = nil

local equipBar = card({
	Name = "EquipmentBar",
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -92),
	Size = UDim2.fromOffset(470, 74),
	Visible = false,
	Parent = hud,
})
responsive(equipBar)
local equipToolLabel = label({
	Text = "",
	Size = UDim2.new(0.5, -16, 0, 34),
	Position = UDim2.fromOffset(12, 6),
	AlignX = Enum.TextXAlignment.Left,
	MaxTextSize = 22,
	Parent = equipBar,
})
local equipTreats = label({
	Text = "",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.new(1, -24, 0, 22),
	Position = UDim2.fromOffset(12, 44),
	AlignX = Enum.TextXAlignment.Left,
	MaxTextSize = 16,
	Parent = equipBar,
})

local chemicalPicker = card({
	Name = "ChemicalPicker",
	AnchorPoint = Vector2.new(1, 1),
	Position = UDim2.new(1, 0, 0, -10),
	Size = UDim2.fromOffset(240, 0),
	AutomaticSize = Enum.AutomaticSize.Y,
	Visible = false,
	ZIndex = 5,
	Parent = equipBar,
})
padding(8).Parent = chemicalPicker
listLayout(Enum.FillDirection.Vertical, 6).Parent = chemicalPicker

local _, chemicalControls = button({
	Name = "Chemical",
	Color = THEME.Sky,
	Text = "",
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -10, 0, 8),
	Size = UDim2.fromOffset(210, 36),
	MaxTextSize = 18,
	Parent = equipBar,
	OnClick = function()
		chemicalPicker.Visible = not chemicalPicker.Visible
	end,
})

local function setChemical(toolId, chemicalId)
	Snapshot.ChemicalLoadout[toolId] = if chemicalId == "" then nil else chemicalId
	CommerceEvent:FireServer("SetChemical", toolId, chemicalId)
	chemicalPicker.Visible = false
	refreshAll()
end

local function updateEquipmentBar()
	local toolId = equippedToolId
	local toolDef = toolId and Catalogue.Tools[toolId]
	equipBar.Visible = toolDef ~= nil and not cinematicActive
	if not toolDef then
		chemicalPicker.Visible = false
		return
	end
	equipToolLabel.Text = ("%s %s"):format(toolDef.Icon, toolDef.DisplayName)
	local chemicalId = Snapshot.ChemicalLoadout[toolId]
	local chemicalDef = chemicalId and Catalogue.Chemicals[chemicalId]
	chemicalControls.SetText(if chemicalDef then ("%s %s ▾"):format(chemicalDef.Icon, chemicalDef.DisplayName) else "Load a chemical ▾")

	local treats = nil
	for _, layer in Catalogue.Layers do
		if layer.Tool == toolId and layer.Chemical == chemicalId then
			treats = layer.DisplayName
		end
	end
	if treats then
		equipTreats.Text = ("✅ Treats: %s"):format(treats)
		equipTreats.TextColor3 = THEME.GreenDark
	else
		local wanted = nil
		for _, layer in Catalogue.Layers do
			if layer.Tool == toolId then
				wanted = layer
			end
		end
		equipTreats.Text = if wanted
			then ("⚠️ Load %s to treat %s"):format(Catalogue.Chemicals[wanted.Chemical].DisplayName, wanted.DisplayName)
			else "This combination doesn't treat anything."
		equipTreats.TextColor3 = THEME.RedDark
	end

	for _, child in chemicalPicker:GetChildren() do
		if child:IsA("GuiButton") then
			child:Destroy()
		end
	end
	local order = 0
	for _, id in sortedIds(Catalogue.Chemicals) do
		if Snapshot.OwnedChemicals[id] then
			order += 1
			local def = Catalogue.Chemicals[id]
			button({
				Text = ("%s %s"):format(def.Icon, def.DisplayName),
				Color = if id == chemicalId then THEME.Green else THEME.Sky,
				Size = UDim2.new(1, 0, 0, 36),
				LayoutOrder = order,
				MaxTextSize = 18,
				ZIndex = 6,
				Parent = chemicalPicker,
				OnClick = function()
					setChemical(toolId, id)
				end,
			})
		end
	end
	button({
		Text = "Empty the tank",
		Color = THEME.Grey,
		Size = UDim2.new(1, 0, 0, 32),
		LayoutOrder = order + 1,
		MaxTextSize = 16,
		ZIndex = 6,
		Parent = chemicalPicker,
		OnClick = function()
			setChemical(toolId, "")
		end,
	})
end
table.insert(refreshers, updateEquipmentBar)

local function watchCharacter(character)
	local function evaluate()
		local tool = character:FindFirstChildOfClass("Tool")
		local toolId = tool and tool:GetAttribute("ToolId")
		if toolId ~= equippedToolId then
			equippedToolId = toolId
			if Snapshot and Catalogue then
				updateEquipmentBar()
			end
		end
	end
	character.ChildAdded:Connect(evaluate)
	character.ChildRemoved:Connect(evaluate)
	evaluate()
end
player.CharacterAdded:Connect(watchCharacter)
if player.Character then
	watchCharacter(player.Character)
end

--------------------------------------------------------------------------------
-- HUD: PHONE AND CUSTOMISE BUTTONS
--------------------------------------------------------------------------------

local openPhone -- forward declarations
local openCustomiser

local sideButtons = make("Frame", {
	Name = "SideButtons",
	AnchorPoint = Vector2.new(1, 1),
	Position = UDim2.new(1, -16, 1, -96),
	Size = UDim2.fromOffset(96, 220),
	BackgroundTransparency = 1,
	Parent = hud,
})
responsive(sideButtons)
local sideLayout = listLayout(Enum.FillDirection.Vertical, 10, Enum.HorizontalAlignment.Right)
sideLayout.VerticalAlignment = Enum.VerticalAlignment.Bottom
sideLayout.Parent = sideButtons

local phoneButton = button({
	Name = "PhoneButton",
	Color = THEME.Purple,
	Text = "📱",
	Size = UDim2.fromOffset(84, 84),
	Radius = 42,
	MaxTextSize = 46,
	LayoutOrder = 2,
	Parent = sideButtons,
	OnClick = function()
		openPhone()
	end,
})
phoneButton.Visible = false
local phoneBadge = make("Frame", {
	Name = "Badge",
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.new(1, -10, 0, 10),
	Size = UDim2.fromOffset(24, 24),
	BackgroundColor3 = THEME.Red,
	Visible = false,
	ZIndex = 4,
	Parent = phoneButton,
})
corner().Parent = phoneBadge
borderStroke(THEME.White, 2).Parent = phoneBadge
label({ Text = "!", Color = THEME.White, ZIndex = 5, Parent = phoneBadge })

local customiseButton = button({
	Name = "CustomiseButton",
	Color = THEME.Yellow,
	Text = "🎨",
	Size = UDim2.fromOffset(72, 72),
	Radius = 36,
	MaxTextSize = 40,
	LayoutOrder = 1,
	Parent = sideButtons,
	OnClick = function()
		openCustomiser()
	end,
})
customiseButton.Visible = false

table.insert(refreshers, function()
	phoneButton.Visible = Snapshot.TutorialStep >= 5
	phoneBadge.Visible = Snapshot.TutorialStep == 5
end)

--------------------------------------------------------------------------------
-- MODAL LAYER
--------------------------------------------------------------------------------

local modalLayer = make("Frame", {
	Name = "ModalLayer",
	Size = UDim2.fromScale(1, 1),
	BackgroundColor3 = Color3.new(0, 0, 0),
	BackgroundTransparency = 1,
	Visible = false,
	ZIndex = 50,
	Parent = screenGui,
})

local openModals = 0
local function showOverlay(visible)
	openModals = math.max(0, openModals + (if visible then 1 else -1))
	if openModals > 0 then
		modalLayer.Visible = true
		tween(modalLayer, 0.25, { BackgroundTransparency = 0.45 })
	else
		tween(modalLayer, 0.25, { BackgroundTransparency = 1 })
		task.delay(0.26, function()
			if openModals == 0 then
				modalLayer.Visible = false
			end
		end)
	end
end

local function modalCard(name, size)
	local holder = make("Frame", {
		Name = name,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = size,
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 51,
		Parent = modalLayer,
	})
	responsive(holder)
	local body = card({ Name = "Body", Size = UDim2.fromScale(1, 1), ZIndex = 51, Parent = holder })
	local pop = make("UIScale", { Parent = body })
	return holder, body, pop
end

local function popIn(holder, pop)
	holder.Visible = true
	pop.Scale = 0.5
	tween(pop, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
	playUiSound("Whoosh", 1.1)
end

local function popOut(holder, pop, after)
	tween(pop, 0.2, { Scale = 0 }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
	task.delay(0.21, function()
		holder.Visible = false
		if after then
			after()
		end
	end)
end

--------------------------------------------------------------------------------
-- COMPANY NAMING MODAL
--------------------------------------------------------------------------------

local NAME_SUGGESTIONS = { "Shine Squad", "Mud Busters", "Gloss Boss", "Bubble & Buff", "Spotless & Co." }

local namingHolder, namingBody, namingPop = modalCard("CompanyNaming", UDim2.fromOffset(560, 470))
padding(18).Parent = namingBody
label({
	Text = "🏷️ Name Your Detailing Company",
	Size = UDim2.new(1, 0, 0, 40),
	ZIndex = 52,
	Parent = namingBody,
})
label({
	Text = "It goes up on your entrance sign and on the side of your Caddy van.",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.new(1, 0, 0, 22),
	Position = UDim2.fromOffset(0, 42),
	MaxTextSize = 16,
	ZIndex = 52,
	Parent = namingBody,
})
local signPreview = card({
	Name = "SignPreview",
	Color = Color3.fromRGB(32, 36, 44),
	Size = UDim2.new(1, 0, 0, 92),
	Position = UDim2.fromOffset(0, 74),
	ZIndex = 52,
	Parent = namingBody,
})
local signPreviewText = label({
	Text = "YOUR COMPANY",
	Font = Enum.Font.GothamBlack,
	Color = THEME.White,
	Stroke = Color3.fromRGB(0, 170, 255),
	StrokeThickness = 3,
	Size = UDim2.new(1, -30, 1, -24),
	Position = UDim2.fromScale(0.5, 0.5),
	AnchorPoint = Vector2.new(0.5, 0.5),
	ZIndex = 53,
	Parent = signPreview,
})

local nameBoxFrame = card({
	Name = "NameBox",
	Color = THEME.CardAlt,
	Size = UDim2.new(1, 0, 0, 56),
	Position = UDim2.fromOffset(0, 180),
	Radius = 14,
	ZIndex = 52,
	Parent = namingBody,
})
local nameBox = make("TextBox", {
	Name = "Input",
	BackgroundTransparency = 1,
	ClearTextOnFocus = false,
	Font = THEME.Title,
	PlaceholderText = "e.g. Sparkle & Shine",
	PlaceholderColor3 = THEME.Grey,
	Text = "",
	TextColor3 = THEME.Ink,
	TextSize = 26,
	TextXAlignment = Enum.TextXAlignment.Left,
	Size = UDim2.new(1, -90, 1, 0),
	Position = UDim2.fromOffset(14, 0),
	ZIndex = 53,
	Parent = nameBoxFrame,
})
local nameCounter = label({
	Text = "0/24",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.fromOffset(64, 30),
	Position = UDim2.new(1, -72, 0.5, -15),
	MaxTextSize = 16,
	ZIndex = 53,
	Parent = nameBoxFrame,
})
local nameError = label({
	Text = "",
	Font = THEME.Body,
	Color = THEME.RedDark,
	Size = UDim2.new(1, 0, 0, 22),
	Position = UDim2.fromOffset(0, 242),
	MaxTextSize = 16,
	ZIndex = 52,
	Parent = namingBody,
})

local suggestionRow = make("Frame", {
	Name = "Suggestions",
	Size = UDim2.new(1, 0, 0, 34),
	Position = UDim2.fromOffset(0, 272),
	BackgroundTransparency = 1,
	ZIndex = 52,
	Parent = namingBody,
})
listLayout(Enum.FillDirection.Horizontal, 6).Parent = suggestionRow
for index, suggestion in NAME_SUGGESTIONS do
	button({
		Text = suggestion,
		Color = THEME.Sky,
		Size = UDim2.fromOffset(98, 32),
		Radius = 16,
		StrokeThickness = 2,
		MaxTextSize = 14,
		LayoutOrder = index,
		ZIndex = 52,
		Parent = suggestionRow,
		OnClick = function()
			nameBox.Text = suggestion
		end,
	})
end

local namePending = false
local _, registerControls
local function submitName()
	if namePending then
		return
	end
	local text = nameBox.Text:match("^%s*(.-)%s*$") or ""
	if #text < 3 then
		nameError.Text = "Use at least 3 characters."
		playUiSound("Error", 0.9)
		return
	end
	namePending = true
	nameError.Text = ""
	registerControls.SetEnabled(false)
	registerControls.SetText("Checking...")
	QuestEvent:FireServer("SubmitCompanyName", text)
	task.delay(8, function()
		if namePending then
			namePending = false
			registerControls.SetEnabled(true)
			registerControls.SetText("Register Company ✓")
			nameError.Text = "No answer from the registry. Try again."
		end
	end)
end
_, registerControls = button({
	Name = "Register",
	Text = "Register Company ✓",
	Color = THEME.Yellow,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, 0),
	Size = UDim2.new(1, 0, 0, 62),
	MaxTextSize = 30,
	ZIndex = 52,
	Parent = namingBody,
	OnClick = submitName,
})

nameBox:GetPropertyChangedSignal("Text"):Connect(function()
	local cleaned = nameBox.Text:gsub("[^%w &'%.%-]", ""):sub(1, 24)
	if cleaned ~= nameBox.Text then
		nameBox.Text = cleaned
		return
	end
	nameCounter.Text = ("%d/24"):format(#cleaned)
	local trimmed = cleaned:match("^%s*(.-)%s*$") or ""
	signPreviewText.Text = if trimmed ~= "" then trimmed:upper() else "YOUR COMPANY"
	nameError.Text = ""
end)
nameBox.FocusLost:Connect(function(enterPressed)
	if enterPressed then
		submitName()
	end
end)

local namingOpen = false
local function openNaming()
	if namingOpen or not Snapshot or Snapshot.TutorialStep ~= 4 then
		return
	end
	namingOpen = true
	showOverlay(true)
	popIn(namingHolder, namingPop)
	task.delay(0.45, function()
		if namingOpen then
			nameBox:CaptureFocus()
		end
	end)
end

local function closeNaming()
	if not namingOpen then
		return
	end
	namingOpen = false
	popOut(namingHolder, namingPop, function()
		showOverlay(false)
	end)
end

--------------------------------------------------------------------------------
-- STARTER KIT REWARD CARD
--------------------------------------------------------------------------------

local kitHolder, kitBody, kitPop = modalCard("KitReward", UDim2.fromOffset(560, 340))
padding(18).Parent = kitBody
label({ Text = "🧰 Starter Detailing Kit!", Size = UDim2.new(1, 0, 0, 42), ZIndex = 52, Parent = kitBody })
label({
	Text = "Loaded into the van. Now drive home and open for business.",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.new(1, 0, 0, 22),
	Position = UDim2.fromOffset(0, 44),
	MaxTextSize = 16,
	ZIndex = 52,
	Parent = kitBody,
})
local kitItems = make("Frame", {
	Name = "Items",
	Size = UDim2.new(1, 0, 0, 140),
	Position = UDim2.fromOffset(0, 78),
	BackgroundTransparency = 1,
	ZIndex = 52,
	Parent = kitBody,
})
listLayout(Enum.FillDirection.Horizontal, 10).Parent = kitItems

local kitOpen = false
local function closeKit()
	if not kitOpen then
		return
	end
	kitOpen = false
	popOut(kitHolder, kitPop, function()
		showOverlay(false)
	end)
end
button({
	Text = "Let's go! 🚐",
	Color = THEME.Green,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, 0),
	Size = UDim2.new(0.7, 0, 0, 56),
	ZIndex = 52,
	Parent = kitBody,
	OnClick = closeKit,
})

local function openKit(items)
	for _, child in kitItems:GetChildren() do
		if child:IsA("Frame") then
			child:Destroy()
		end
	end
	for index, item in items do
		local tile = card({ Color = THEME.CardAlt, Size = UDim2.fromOffset(92, 130), LayoutOrder = index, Radius = 16, ZIndex = 52, Parent = kitItems })
		label({ Text = item.Icon or "🧽", Size = UDim2.new(1, 0, 0, 64), Position = UDim2.fromOffset(0, 8), ZIndex = 53, Parent = tile })
		label({
			Text = item.Name or "",
			Font = THEME.Body,
			Size = UDim2.new(1, -10, 0, 48),
			Position = UDim2.fromOffset(5, 76),
			MaxTextSize = 15,
			ZIndex = 53,
			Parent = tile,
		})
		local tileScale = make("UIScale", { Scale = 0, Parent = tile })
		task.delay(0.1 * index, function()
			tween(tileScale, 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
		end)
	end
	kitOpen = true
	showOverlay(true)
	popIn(kitHolder, kitPop)
	task.delay(8, closeKit)
end

--------------------------------------------------------------------------------
-- VIRTUAL SMARTPHONE
--------------------------------------------------------------------------------

local PHONE_SIZE = Vector2.new(380, 700)

local phone = make("Frame", {
	Name = "Phone",
	Size = UDim2.fromOffset(PHONE_SIZE.X, PHONE_SIZE.Y),
	BackgroundColor3 = Color3.fromRGB(22, 24, 30),
	Visible = false,
	ZIndex = 30,
	Parent = root,
})
corner(48).Parent = phone
borderStroke(Color3.fromRGB(70, 74, 86), 4).Parent = phone
responsive(phone)

local phoneScreen = make("Frame", {
	Name = "Screen",
	Position = UDim2.fromOffset(10, 10),
	Size = UDim2.new(1, -20, 1, -20),
	BackgroundColor3 = Color3.fromRGB(255, 255, 255),
	ClipsDescendants = true,
	ZIndex = 30,
	Parent = phone,
})
corner(38).Parent = phoneScreen
make("UIGradient", {
	Color = ColorSequence.new(Color3.fromRGB(110, 200, 255), Color3.fromRGB(170, 120, 255)),
	Rotation = 120,
	Parent = phoneScreen,
})

local notch = make("Frame", {
	Name = "Notch",
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 8),
	Size = UDim2.fromOffset(96, 24),
	BackgroundColor3 = Color3.fromRGB(10, 10, 12),
	ZIndex = 35,
	Parent = phoneScreen,
})
corner().Parent = notch

local clockLabel = label({
	Text = "12:00",
	Color = THEME.White,
	Size = UDim2.fromOffset(70, 22),
	Position = UDim2.fromOffset(22, 9),
	AlignX = Enum.TextXAlignment.Left,
	MaxTextSize = 16,
	ZIndex = 34,
	Parent = phoneScreen,
})
label({
	Text = "📶 🔋",
	Color = THEME.White,
	Size = UDim2.fromOffset(70, 22),
	Position = UDim2.new(1, -86, 0, 9),
	AlignX = Enum.TextXAlignment.Right,
	MaxTextSize = 15,
	ZIndex = 34,
	Parent = phoneScreen,
})
task.spawn(function()
	while true do
		clockLabel.Text = os.date("%H:%M")
		task.wait(20)
	end
end)

local phoneTitle = label({
	Text = "Home",
	Color = THEME.White,
	Stroke = THEME.Ink,
	Size = UDim2.new(1, -120, 0, 34),
	Position = UDim2.new(0.5, 0, 0, 42),
	AnchorPoint = Vector2.new(0.5, 0),
	ZIndex = 34,
	Parent = phoneScreen,
})

local closePhone -- forward declaration
local showPhonePage

local backButton = button({
	Name = "Back",
	Text = "‹",
	Color = THEME.Sky,
	Size = UDim2.fromOffset(40, 40),
	Position = UDim2.fromOffset(14, 40),
	Radius = 20,
	MaxTextSize = 30,
	ZIndex = 34,
	Parent = phoneScreen,
	OnClick = function()
		showPhonePage("Home")
	end,
})
button({
	Name = "Close",
	Text = "✕",
	Color = THEME.Red,
	Size = UDim2.fromOffset(40, 40),
	Position = UDim2.new(1, -54, 0, 40),
	Radius = 20,
	MaxTextSize = 24,
	ZIndex = 34,
	Parent = phoneScreen,
	OnClick = function()
		closePhone()
	end,
})

local homeBar = make("TextButton", {
	Name = "HomeBar",
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, -8),
	Size = UDim2.fromOffset(120, 6),
	BackgroundColor3 = THEME.White,
	Text = "",
	AutoButtonColor = false,
	ZIndex = 34,
	Parent = phoneScreen,
})
corner().Parent = homeBar
homeBar.Activated:Connect(function()
	showPhonePage("Home")
end)

local pageArea = make("Frame", {
	Name = "Pages",
	Position = UDim2.fromOffset(10, 90),
	Size = UDim2.new(1, -20, 1, -112),
	BackgroundTransparency = 1,
	ZIndex = 31,
	Parent = phoneScreen,
})

local function phonePage(name)
	local page = make("ScrollingFrame", {
		Name = name,
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = THEME.White,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ScrollingDirection = Enum.ScrollingDirection.Y,
		Visible = false,
		ZIndex = 31,
		Parent = pageArea,
	})
	local layout = listLayout(Enum.FillDirection.Vertical, 10)
	layout.Parent = page
	padding(4, 6, 12, 6).Parent = page
	return page
end

local pages = {
	Home = phonePage("Home"),
	Ads = phonePage("Ads"),
	Supplies = phonePage("Supplies"),
	Upgrades = phonePage("Upgrades"),
	Van = phonePage("Van"),
}
local PAGE_TITLES = { Home = "Home", Ads = "📣 Ads Manager", Supplies = "🧰 Supplies", Upgrades = "🏗️ Upgrades", Van = "🚐 My Van" }
local currentPage = "Home"
local phoneOpen = false
local pageBuilders = {}

local function clearPage(page)
	for _, child in page:GetChildren() do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
end

local function sectionTitle(page, text, order)
	label({
		Text = text,
		Color = THEME.White,
		Stroke = THEME.Ink,
		Size = UDim2.new(1, 0, 0, 26),
		AlignX = Enum.TextXAlignment.Left,
		LayoutOrder = order,
		MaxTextSize = 20,
		ZIndex = 32,
		Parent = page,
	})
end

-- A shop row: icon, name, description, and an action button on the right.
local function shopRow(page, order, spec)
	local row = card({ Size = UDim2.new(1, 0, 0, 92), LayoutOrder = order, Radius = 16, ZIndex = 32, Parent = page })
	if spec.Highlight then
		local stroke = row:FindFirstChildOfClass("UIStroke")
		stroke.Color = THEME.Yellow
		stroke.Thickness = 5
		local pulse = TweenService:Create(stroke, TweenInfo.new(0.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), { Thickness = 2 })
		pulse:Play()
		local tag = card({
			Color = THEME.Yellow,
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -8, 0, -12),
			Size = UDim2.fromOffset(110, 24),
			Radius = 12,
			StrokeThickness = 2,
			ZIndex = 35,
			Parent = row,
		})
		label({ Text = "👇 Start here", Color = THEME.Ink, Size = UDim2.new(1, -8, 1, -4), Position = UDim2.fromOffset(4, 2), ZIndex = 36, Parent = tag })
	end
	label({ Text = spec.Icon or "", Size = UDim2.fromOffset(48, 48), Position = UDim2.fromOffset(8, 22), ZIndex = 33, Parent = row })
	label({
		Text = spec.Title,
		Size = UDim2.new(1, -170, 0, 24),
		Position = UDim2.fromOffset(60, 8),
		AlignX = Enum.TextXAlignment.Left,
		MaxTextSize = 18,
		ZIndex = 33,
		Parent = row,
	})
	label({
		Text = spec.Description or "",
		Font = THEME.Body,
		Color = THEME.Muted,
		Size = UDim2.new(1, -170, 0, 50),
		Position = UDim2.fromOffset(60, 34),
		AlignX = Enum.TextXAlignment.Left,
		AlignY = Enum.TextYAlignment.Top,
		MaxTextSize = 13,
		ZIndex = 33,
		Parent = row,
	})
	local _, controls = button({
		Text = spec.ButtonText,
		Color = spec.ButtonColor or THEME.Green,
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.fromOffset(98, 44),
		MaxTextSize = 17,
		ZIndex = 33,
		Parent = row,
		OnClick = spec.OnClick,
	})
	controls.SetEnabled(spec.Enabled ~= false)
	return row
end

local function infoCard(page, order, text, height)
	local info = card({ Size = UDim2.new(1, 0, 0, height or 64), LayoutOrder = order, Radius = 16, Color = THEME.CardAlt, ZIndex = 32, Parent = page })
	label({
		Text = text,
		Font = THEME.Body,
		Size = UDim2.new(1, -20, 1, -12),
		Position = UDim2.fromOffset(10, 6),
		MaxTextSize = 15,
		ZIndex = 33,
		Parent = info,
	})
	return info
end

local APPS = {
	{ Id = "Ads", Icon = "📣", Name = "Ads", Color = Color3.fromRGB(255, 120, 80) },
	{ Id = "Supplies", Icon = "🧰", Name = "Supplies", Color = Color3.fromRGB(70, 205, 90) },
	{ Id = "Upgrades", Icon = "🏗️", Name = "Upgrades", Color = Color3.fromRGB(255, 200, 50) },
	{ Id = "Van", Icon = "🚐", Name = "My Van", Color = Color3.fromRGB(64, 170, 255) },
}

pageBuilders.Home = function(page)
	local header = card({ Size = UDim2.new(1, 0, 0, 96), LayoutOrder = 1, Radius = 20, ZIndex = 32, Parent = page })
	label({
		Text = if Snapshot.CompanyName ~= "" then Snapshot.CompanyName else "Your Company",
		Size = UDim2.new(1, -20, 0, 34),
		Position = UDim2.fromOffset(10, 8),
		ZIndex = 33,
		Parent = header,
	})
	label({
		Text = ("%s  •  %d customer%s queued"):format(
			formatMoney(Snapshot.Cash),
			Snapshot.PendingCustomers,
			if Snapshot.PendingCustomers == 1 then "" else "s"
		),
		Font = THEME.Body,
		Color = THEME.Muted,
		Size = UDim2.new(1, -20, 0, 22),
		Position = UDim2.fromOffset(10, 48),
		MaxTextSize = 16,
		ZIndex = 33,
		Parent = header,
	})
	label({
		Text = ("Jobs done: %d"):format(Snapshot.JobsCompleted),
		Font = THEME.Body,
		Color = THEME.Muted,
		Size = UDim2.new(1, -20, 0, 18),
		Position = UDim2.fromOffset(10, 72),
		MaxTextSize = 14,
		ZIndex = 33,
		Parent = header,
	})

	local grid = make("Frame", { Size = UDim2.new(1, 0, 0, 300), BackgroundTransparency = 1, LayoutOrder = 2, ZIndex = 32, Parent = page })
	make("UIGridLayout", {
		CellSize = UDim2.fromOffset(136, 136),
		CellPadding = UDim2.fromOffset(12, 14),
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		SortOrder = Enum.SortOrder.LayoutOrder,
		Parent = grid,
	})
	for index, app in APPS do
		local tile = make("TextButton", { Text = "", AutoButtonColor = false, BackgroundTransparency = 1, LayoutOrder = index, ZIndex = 32, Parent = grid })
		local icon = card({
			Color = app.Color,
			AnchorPoint = Vector2.new(0.5, 0),
			Position = UDim2.fromScale(0.5, 0),
			Size = UDim2.fromOffset(96, 96),
			Radius = 26,
			ZIndex = 33,
			Parent = tile,
		})
		shine().Parent = icon
		label({ Text = app.Icon, Size = UDim2.new(1, -20, 1, -20), Position = UDim2.fromOffset(10, 10), ZIndex = 34, Parent = icon })
		label({
			Text = app.Name,
			Color = THEME.White,
			Stroke = THEME.Ink,
			Size = UDim2.new(1, 0, 0, 26),
			Position = UDim2.fromOffset(0, 104),
			MaxTextSize = 18,
			ZIndex = 33,
			Parent = tile,
		})
		if app.Id == "Ads" and Snapshot.TutorialStep == 5 then
			local badge = make("Frame", {
				AnchorPoint = Vector2.new(0.5, 0.5),
				Position = UDim2.new(1, -4, 0, 4),
				Size = UDim2.fromOffset(26, 26),
				BackgroundColor3 = THEME.Red,
				ZIndex = 35,
				Parent = icon,
			})
			corner().Parent = badge
			label({ Text = "1", Color = THEME.White, ZIndex = 36, Parent = badge })
		end
		local iconScale = make("UIScale", { Parent = icon })
		tile.Activated:Connect(function()
			playUiSound("Click", 1.2)
			iconScale.Scale = 0.85
			tween(iconScale, 0.3, { Scale = 1 }, Enum.EasingStyle.Back)
			showPhonePage(app.Id)
		end)
	end
end

pageBuilders.Ads = function(page)
	infoCard(page, 1, ("Customers queued: %d  •  Every advert sends cars straight to your wash bay."):format(Snapshot.PendingCustomers), 58)
	for index, id in sortedIds(Catalogue.Adverts) do
		local def = Catalogue.Adverts[id]
		shopRow(page, index + 1, {
			Icon = def.Icon,
			Title = def.DisplayName,
			Description = def.Description,
			ButtonText = "Launch " .. formatMoney(def.Price),
			Enabled = Snapshot.Cash >= def.Price,
			Highlight = Snapshot.TutorialStep == 5 and id == "LeafletDrop",
			OnClick = function()
				CommerceEvent:FireServer("BuyAdvert", id)
			end,
		})
	end
end

pageBuilders.Supplies = function(page)
	local order = 0
	local function nextOrder()
		order += 1
		return order
	end
	sectionTitle(page, "Power tools", nextOrder())
	for _, id in sortedIds(Catalogue.Tools) do
		local def = Catalogue.Tools[id]
		local owned = Snapshot.OwnedTools[id]
		local missing = nil
		for _, kitId in def.Requires do
			if not Snapshot.OwnedKit[kitId] then
				missing = Catalogue.Kit[kitId].DisplayName
			end
		end
		local treats = {}
		for _, layer in Catalogue.Layers do
			if layer.Tool == id then
				table.insert(treats, layer.DisplayName)
			end
		end
		shopRow(page, nextOrder(), {
			Icon = def.Icon,
			Title = def.DisplayName,
			Description = ("%s Treats %s."):format(def.Description, table.concat(treats, ", ")),
			ButtonText = if owned then "Owned ✓" elseif missing then "Needs " .. missing else formatMoney(def.Price),
			ButtonColor = if owned then THEME.Grey else THEME.Green,
			Enabled = not owned and not missing and Snapshot.Cash >= def.Price,
			OnClick = function()
				CommerceEvent:FireServer("BuyTool", id)
			end,
		})
	end
	sectionTitle(page, "Chemicals", nextOrder())
	for _, id in sortedIds(Catalogue.Chemicals) do
		local def = Catalogue.Chemicals[id]
		local owned = Snapshot.OwnedChemicals[id]
		shopRow(page, nextOrder(), {
			Icon = def.Icon,
			Title = def.DisplayName,
			Description = def.Description,
			ButtonText = if owned then "Owned ✓" else formatMoney(def.Price),
			ButtonColor = if owned then THEME.Grey else THEME.Green,
			Enabled = not owned and Snapshot.Cash >= def.Price,
			OnClick = function()
				CommerceEvent:FireServer("BuyChemical", id)
			end,
		})
	end
	sectionTitle(page, "Starter kit", nextOrder())
	for _, id in sortedIds(Catalogue.Kit) do
		local def = Catalogue.Kit[id]
		shopRow(page, nextOrder(), {
			Icon = def.Icon,
			Title = def.DisplayName,
			Description = def.Description,
			ButtonText = if Snapshot.OwnedKit[id] then "Owned ✓" else "Free at store",
			ButtonColor = THEME.Grey,
			Enabled = false,
		})
	end
	sectionTitle(page, "Cheat sheet", nextOrder())
	for _, layerId in sortedIds(Catalogue.Layers) do
		local layer = Catalogue.Layers[layerId]
		infoCard(page, nextOrder(), ("%s → %s + %s  (+%s a hit)"):format(
			layer.DisplayName,
			Catalogue.Tools[layer.Tool].DisplayName,
			Catalogue.Chemicals[layer.Chemical].DisplayName,
			formatMoney(layer.Value)
		), 52)
	end
end

pageBuilders.Upgrades = function(page)
	infoCard(page, 1, ("Plot bonus: +%d%% on every hit."):format(math.floor(((Snapshot.PayoutMultiplier or 1) - 1) * 100 + 0.5)), 48)
	local order = 1
	for _, id in sortedIds(Catalogue.Structures) do
		local def = Catalogue.Structures[id]
		if not def.Core then
			order += 1
			local built = Snapshot.UnlockedStructures[id]
			shopRow(page, order, {
				Icon = def.Icon,
				Title = def.DisplayName,
				Description = def.Description,
				ButtonText = if built then "Built ✓" else formatMoney(def.Price),
				ButtonColor = if built then THEME.Grey else THEME.Yellow,
				Enabled = not built and Snapshot.Cash >= def.Price,
				OnClick = function()
					CommerceEvent:FireServer("BuyStructure", id)
				end,
			})
		end
	end
end

pageBuilders.Van = function(page)
	infoCard(page, 1, "Drive into the yellow VAN UPGRADES garage on your plot to change the sign writing, paint and interior.", 78)
	shopRow(page, 2, {
		Icon = "🛻",
		Title = "Recover Van",
		Description = "Stuck or flipped? We'll tow it back to your plot.",
		ButtonText = "Recover",
		ButtonColor = THEME.Sky,
		OnClick = function()
			UpgradeVanEvent:FireServer("RecoverVan", {})
		end,
	})
	local stats = card({ Size = UDim2.new(1, 0, 0, 120), LayoutOrder = 3, Radius = 16, ZIndex = 32, Parent = page })
	label({
		Text = ("📈 Lifetime earnings: %s\n🧽 Jobs completed: %d\n✨ Plot bonus: +%d%%"):format(
			formatMoney(Snapshot.LifetimeEarnings),
			Snapshot.JobsCompleted,
			math.floor(((Snapshot.PayoutMultiplier or 1) - 1) * 100 + 0.5)
		),
		Font = THEME.Body,
		Size = UDim2.new(1, -20, 1, -16),
		Position = UDim2.fromOffset(10, 8),
		AlignX = Enum.TextXAlignment.Left,
		MaxTextSize = 17,
		ZIndex = 33,
		Parent = stats,
	})
end

showPhonePage = function(name)
	if not pages[name] or not Snapshot or not Catalogue then
		return
	end
	currentPage = name
	for pageName, page in pages do
		page.Visible = pageName == name
	end
	clearPage(pages[name])
	pageBuilders[name](pages[name])
	phoneTitle.Text = PAGE_TITLES[name]
	backButton.Visible = name ~= "Home"
	pages[name].CanvasPosition = Vector2.zero
end

local function phonePositions()
	if isPortrait() then
		phone.AnchorPoint = Vector2.new(0.5, 0.5)
		return UDim2.fromScale(0.5, 0.5), UDim2.new(0.5, 0, 1.5, PHONE_SIZE.Y)
	end
	phone.AnchorPoint = Vector2.new(1, 1)
	return UDim2.new(1, -16, 1, -16), UDim2.new(1, -16, 1, PHONE_SIZE.Y + 40)
end

openPhone = function(app)
	if not Snapshot or not Catalogue or Snapshot.TutorialStep < 5 then
		return
	end
	local shown, hidden = phonePositions()
	showPhonePage(app or (if Snapshot.TutorialStep == 5 then "Ads" else "Home"))
	if phoneOpen then
		return
	end
	phoneOpen = true
	sideButtons.Visible = false
	phone.Position = hidden
	phone.Visible = true
	tween(phone, 0.5, { Position = shown }, Enum.EasingStyle.Back)
	playUiSound("Whoosh", 1)
end

closePhone = function()
	if not phoneOpen then
		return
	end
	phoneOpen = false
	local _, hidden = phonePositions()
	tween(phone, 0.35, { Position = hidden }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
	playUiSound("Whoosh", 0.8)
	task.delay(0.36, function()
		if not phoneOpen then
			phone.Visible = false
			sideButtons.Visible = true
		end
	end)
end

table.insert(refreshers, function()
	if phoneOpen then
		local scroll = pages[currentPage].CanvasPosition
		showPhonePage(currentPage)
		pages[currentPage].CanvasPosition = scroll
	end
end)

table.insert(layoutListeners, function()
	if phoneOpen then
		local shown = phonePositions()
		phone.Position = shown
	end
end)

--------------------------------------------------------------------------------
-- VAN UPGRADES PANEL  (Sign Writing · Paint Shop · Interior Layout)
--------------------------------------------------------------------------------

local PAINT_PRESETS = {
	{ "Classic White", 242, 243, 243 },
	{ "Jet Black", 25, 25, 28 },
	{ "Silver", 190, 194, 200 },
	{ "Racing Red", 200, 30, 40 },
	{ "Ocean Blue", 30, 90, 200 },
	{ "Forest Green", 40, 120, 60 },
	{ "Sunshine", 250, 200, 40 },
	{ "Tangerine", 250, 120, 30 },
	{ "Bubblegum", 255, 120, 190 },
	{ "Royal Purple", 110, 60, 180 },
}

local function getVan()
	local world = Workspace:FindFirstChild("CarDetailingTycoon")
	local vans = world and world:FindFirstChild("Vans")
	return vans and vans:FindFirstChild("Van_" .. player.UserId)
end

-- Local previews: only this client sees them until the server applies the change.
local function previewSign(fontName, textColourKey, strokeColourKey)
	local van = getVan()
	if not van or not Catalogue then
		return
	end
	local textColour = Catalogue.Colours[textColourKey]
	local strokeColour = Catalogue.Colours[strokeColourKey]
	local font = (Enum.Font :: any)[fontName]
	for _, gui in van:GetDescendants() do
		if gui:IsA("SurfaceGui") and gui.Name:sub(1, 12) == "SignWriting_" then
			local name = gui:FindFirstChild("CompanyName")
			local tagline = gui:FindFirstChild("Tagline")
			local stripe = gui:FindFirstChild("WrapStripe")
			local accent = gui:FindFirstChild("WrapAccent")
			if name then
				name.Font = font
				name.TextColor3 = textColour
				local stroke = name:FindFirstChildOfClass("UIStroke")
				if stroke then
					stroke.Color = strokeColour
				end
			end
			if tagline then
				tagline.TextColor3 = textColour
			end
			if stripe then
				stripe.BackgroundColor3 = textColour
			end
			if accent then
				accent.BackgroundColor3 = strokeColour
			end
		end
	end
end

local function previewPaint(color)
	local van = getVan()
	if not van then
		return
	end
	for _, part in van:GetDescendants() do
		if part:IsA("BasePart") and part:GetAttribute("Paintable") then
			part.Color = color
		end
	end
end

local Draft = { Font = "GothamBlack", TextColor = "Navy", StrokeColor = "White", R = 242, G = 243, B = 243 }

local function resetDraft()
	local van = Snapshot.Van
	Draft.Font = van.SignFont
	Draft.TextColor = van.SignTextColor
	Draft.StrokeColor = van.SignStrokeColor
	Draft.R, Draft.G, Draft.B = van.Paint[1], van.Paint[2], van.Paint[3]
end

local function revertPreviews()
	if not Snapshot then
		return
	end
	local van = Snapshot.Van
	previewSign(van.SignFont, van.SignTextColor, van.SignStrokeColor)
	previewPaint(Color3.fromRGB(van.Paint[1], van.Paint[2], van.Paint[3]))
end

local customiser = card({
	Name = "VanUpgrades",
	Size = UDim2.fromOffset(580, 560),
	Visible = false,
	ZIndex = 20,
	Parent = root,
})
responsive(customiser)
local customiserPop = make("UIScale", { Parent = customiser })
label({
	Text = "🚐 Van Upgrades",
	Size = UDim2.new(1, -150, 0, 40),
	Position = UDim2.fromOffset(18, 10),
	AlignX = Enum.TextXAlignment.Left,
	ZIndex = 21,
	Parent = customiser,
})
local customiserCash = label({
	Text = "",
	Color = THEME.GreenDark,
	Size = UDim2.fromOffset(120, 30),
	Position = UDim2.new(1, -184, 0, 15),
	AlignX = Enum.TextXAlignment.Right,
	ZIndex = 21,
	Parent = customiser,
})

local tabBar = make("Frame", {
	Name = "Tabs",
	Size = UDim2.new(1, -36, 0, 44),
	Position = UDim2.fromOffset(18, 56),
	BackgroundTransparency = 1,
	ZIndex = 21,
	Parent = customiser,
})
listLayout(Enum.FillDirection.Horizontal, 8, Enum.HorizontalAlignment.Left).Parent = tabBar

local tabPages = {}
local tabControls = {}
local currentTab = "Sign"
local customiserOpen = false
local closeCustomiser -- forward declaration

local function tabPage(name)
	local page = make("Frame", {
		Name = name,
		Size = UDim2.new(1, -36, 1, -122),
		Position = UDim2.fromOffset(18, 110),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 21,
		Parent = customiser,
	})
	tabPages[name] = page
	return page
end

local function selectTab(name)
	currentTab = name
	for tabName, page in tabPages do
		page.Visible = tabName == name
		tabControls[tabName].SetColor(if tabName == name then THEME.Sky else THEME.Grey)
	end
	if customiserOpen then
		CameraFocusSignal:Fire(if name == "Interior" then "VanInterior" else "Van")
	end
end

for index, spec in { { "Sign", "✍️ Sign Writing" }, { "Paint", "🎨 Paint Shop" }, { "Interior", "📦 Interior" } } do
	local _, controls = button({
		Text = spec[2],
		Color = THEME.Grey,
		Size = UDim2.fromOffset(170, 42),
		LayoutOrder = index,
		MaxTextSize = 19,
		ZIndex = 22,
		Parent = tabBar,
		OnClick = function()
			selectTab(spec[1])
		end,
	})
	tabControls[spec[1]] = controls
end

button({
	Name = "Close",
	Text = "✕",
	Color = THEME.Red,
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -14, 0, 12),
	Size = UDim2.fromOffset(42, 42),
	Radius = 21,
	MaxTextSize = 24,
	ZIndex = 22,
	Parent = customiser,
	OnClick = function()
		closeCustomiser()
	end,
})

local function swatch(parent, color, order, selected, onClick)
	local holder = make("TextButton", {
		Text = "",
		AutoButtonColor = false,
		BackgroundColor3 = color,
		LayoutOrder = order,
		ZIndex = 23,
		Parent = parent,
	})
	corner(10).Parent = holder
	borderStroke(if selected then THEME.Yellow else THEME.Ink, if selected then 4 else 2).Parent = holder
	holder.Activated:Connect(function()
		playUiSound("Click", 1.3)
		onClick()
	end)
	return holder
end

local function swatchGrid(parent, name, position, cell)
	local grid = make("Frame", {
		Name = name,
		Position = position,
		Size = UDim2.new(1, 0, 0, cell + 4),
		BackgroundTransparency = 1,
		ZIndex = 22,
		Parent = parent,
	})
	make("UIGridLayout", {
		CellSize = UDim2.fromOffset(cell, cell),
		CellPadding = UDim2.fromOffset(6, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
		Parent = grid,
	})
	return grid
end

local function clearButtons(container)
	for _, child in container:GetChildren() do
		if child:IsA("GuiButton") then
			child:Destroy()
		end
	end
end

local function colourKeys()
	local keys = {}
	for key in Catalogue.Colours do
		table.insert(keys, key)
	end
	table.sort(keys, function(a, b)
		local h1, s1, v1 = Catalogue.Colours[a]:ToHSV()
		local h2, s2, v2 = Catalogue.Colours[b]:ToHSV()
		local grey1, grey2 = s1 < 0.15, s2 < 0.15
		if grey1 ~= grey2 then
			return grey2
		end
		if grey1 then
			return v1 > v2
		end
		return h1 < h2
	end)
	return keys
end

-- Sign Writing ---------------------------------------------------------------

local signPage = tabPage("Sign")
local signPreviewCard = card({ Color = Color3.fromRGB(245, 245, 247), Size = UDim2.new(1, 0, 0, 92), ZIndex = 22, Parent = signPage })
local signPreviewStripe = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.82),
	Size = UDim2.new(1.2, 0, 0, 14),
	Rotation = -3,
	BorderSizePixel = 0,
	ZIndex = 22,
	Parent = signPreviewCard,
})
local signPreviewName = label({
	Text = "",
	Size = UDim2.new(1, -30, 0, 50),
	Position = UDim2.fromOffset(15, 8),
	ZIndex = 23,
	Parent = signPreviewCard,
})
local signPreviewNameStroke = textStroke(THEME.White, 3)
signPreviewNameStroke.Parent = signPreviewName
signPreviewCard.ClipsDescendants = true

label({ Text = "Font", Size = UDim2.new(1, 0, 0, 22), Position = UDim2.fromOffset(0, 100), AlignX = Enum.TextXAlignment.Left, MaxTextSize = 18, ZIndex = 22, Parent = signPage })
local fontGrid = make("Frame", { Position = UDim2.fromOffset(0, 124), Size = UDim2.new(1, 0, 0, 92), BackgroundTransparency = 1, ZIndex = 22, Parent = signPage })
make("UIGridLayout", { CellSize = UDim2.fromOffset(128, 42), CellPadding = UDim2.fromOffset(6, 6), SortOrder = Enum.SortOrder.LayoutOrder, Parent = fontGrid })
label({ Text = "Lettering colour", Size = UDim2.new(1, 0, 0, 22), Position = UDim2.fromOffset(0, 222), AlignX = Enum.TextXAlignment.Left, MaxTextSize = 18, ZIndex = 22, Parent = signPage })
local letteringGrid = swatchGrid(signPage, "Lettering", UDim2.fromOffset(0, 246), 36)
label({ Text = "Outline colour", Size = UDim2.new(1, 0, 0, 22), Position = UDim2.fromOffset(0, 292), AlignX = Enum.TextXAlignment.Left, MaxTextSize = 18, ZIndex = 22, Parent = signPage })
local outlineGrid = swatchGrid(signPage, "Outline", UDim2.fromOffset(0, 316), 36)

local _, signApply = button({
	Text = "Apply",
	Color = THEME.Green,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, 0),
	Size = UDim2.new(1, 0, 0, 52),
	ZIndex = 22,
	Parent = signPage,
	OnClick = function()
		UpgradeVanEvent:FireServer("SignWriting", { Font = Draft.Font, TextColor = Draft.TextColor, StrokeColor = Draft.StrokeColor })
	end,
})

local function refreshSignPage()
	local font = (Enum.Font :: any)[Draft.Font]
	local textColour = Catalogue.Colours[Draft.TextColor]
	local strokeColour = Catalogue.Colours[Draft.StrokeColor]
	signPreviewName.Text = if Snapshot.CompanyName ~= "" then Snapshot.CompanyName else "Your Company"
	signPreviewName.Font = font
	signPreviewName.TextColor3 = textColour
	signPreviewNameStroke.Color = strokeColour
	signPreviewStripe.BackgroundColor3 = textColour

	clearButtons(fontGrid)
	for index, fontName in Catalogue.Fonts do
		local fontButton = button({
			Text = fontName,
			Color = if fontName == Draft.Font then THEME.Sky else THEME.Grey,
			LayoutOrder = index,
			MaxTextSize = 18,
			ZIndex = 23,
			Parent = fontGrid,
			OnClick = function()
				Draft.Font = fontName
				refreshSignPage()
				previewSign(Draft.Font, Draft.TextColor, Draft.StrokeColor)
			end,
		})
		local caption = fontButton:FindFirstChild("Label")
		if caption then
			caption.Font = (Enum.Font :: any)[fontName]
		end
	end

	clearButtons(letteringGrid)
	clearButtons(outlineGrid)
	for index, key in colourKeys() do
		swatch(letteringGrid, Catalogue.Colours[key], index, key == Draft.TextColor, function()
			Draft.TextColor = key
			refreshSignPage()
			previewSign(Draft.Font, Draft.TextColor, Draft.StrokeColor)
		end)
		swatch(outlineGrid, Catalogue.Colours[key], index, key == Draft.StrokeColor, function()
			Draft.StrokeColor = key
			refreshSignPage()
			previewSign(Draft.Font, Draft.TextColor, Draft.StrokeColor)
		end)
	end

	local van = Snapshot.Van
	local changed = Draft.Font ~= van.SignFont or Draft.TextColor ~= van.SignTextColor or Draft.StrokeColor ~= van.SignStrokeColor
	signApply.SetText(if changed then ("Apply sign writing • %s"):format(formatMoney(Catalogue.Prices.SignWriting)) else "No changes yet")
	signApply.SetEnabled(changed and Snapshot.Cash >= Catalogue.Prices.SignWriting)
end

-- Paint Shop -----------------------------------------------------------------

local paintPage = tabPage("Paint")
local paintPreview = card({ Size = UDim2.fromOffset(150, 150), Radius = 24, ZIndex = 22, Parent = paintPage })
local paintValue = label({
	Text = "",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.fromOffset(150, 22),
	Position = UDim2.fromOffset(0, 156),
	MaxTextSize = 15,
	ZIndex = 22,
	Parent = paintPage,
})
local presetGrid = make("Frame", {
	Position = UDim2.fromOffset(166, 0),
	Size = UDim2.new(1, -166, 0, 150),
	BackgroundTransparency = 1,
	ZIndex = 22,
	Parent = paintPage,
})
make("UIGridLayout", { CellSize = UDim2.fromOffset(66, 66), CellPadding = UDim2.fromOffset(8, 8), SortOrder = Enum.SortOrder.LayoutOrder, Parent = presetGrid })

local refreshPaintPage -- forward declaration
local sliders = {}

local function makeSlider(channel, order)
	local y = 188 + (order - 1) * 54
	label({ Text = channel, Size = UDim2.fromOffset(30, 36), Position = UDim2.fromOffset(0, y), ZIndex = 22, Parent = paintPage })
	local track = make("TextButton", {
		Text = "",
		AutoButtonColor = false,
		Position = UDim2.fromOffset(40, y + 8),
		Size = UDim2.new(1, -110, 0, 20),
		BackgroundColor3 = THEME.White,
		ZIndex = 22,
		Parent = paintPage,
	})
	corner().Parent = track
	borderStroke(THEME.Ink, 2).Parent = track
	local gradient = make("UIGradient", { Parent = track })
	local knob = make("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0, 0.5),
		Size = UDim2.fromOffset(30, 30),
		BackgroundColor3 = THEME.White,
		ZIndex = 24,
		Parent = track,
	})
	corner().Parent = knob
	borderStroke(THEME.Ink, 3).Parent = knob
	local valueLabel = label({ Text = "0", Size = UDim2.fromOffset(54, 36), Position = UDim2.new(1, -56, 0, y), ZIndex = 22, Parent = paintPage })

	local dragging = false
	local function setFromX(x)
		local relative = math.clamp((x - track.AbsolutePosition.X) / math.max(track.AbsoluteSize.X, 1), 0, 1)
		Draft[channel] = math.floor(relative * 255 + 0.5)
		refreshPaintPage()
		previewPaint(Color3.fromRGB(Draft.R, Draft.G, Draft.B))
	end
	track.InputBegan:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragging = true
			setFromX(input.Position.X)
		end
	end)
	UserInputService.InputChanged:Connect(function(input)
		if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
			setFromX(input.Position.X)
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
			dragging = false
		end
	end)
	sliders[channel] = { Knob = knob, Gradient = gradient, Value = valueLabel }
end
makeSlider("R", 1)
makeSlider("G", 2)
makeSlider("B", 3)

local _, paintApply = button({
	Text = "Respray",
	Color = THEME.Green,
	AnchorPoint = Vector2.new(0.5, 1),
	Position = UDim2.new(0.5, 0, 1, 0),
	Size = UDim2.new(1, 0, 0, 52),
	ZIndex = 22,
	Parent = paintPage,
	OnClick = function()
		UpgradeVanEvent:FireServer("Paint", { R = Draft.R, G = Draft.G, B = Draft.B })
	end,
})

refreshPaintPage = function()
	local color = Color3.fromRGB(Draft.R, Draft.G, Draft.B)
	paintPreview.BackgroundColor3 = color
	paintValue.Text = ("RGB %d, %d, %d"):format(Draft.R, Draft.G, Draft.B)
	for channel, slider in sliders do
		slider.Knob.Position = UDim2.fromScale(Draft[channel] / 255, 0.5)
		slider.Value.Text = tostring(Draft[channel])
		local low = Color3.fromRGB(if channel == "R" then 0 else Draft.R, if channel == "G" then 0 else Draft.G, if channel == "B" then 0 else Draft.B)
		local high = Color3.fromRGB(if channel == "R" then 255 else Draft.R, if channel == "G" then 255 else Draft.G, if channel == "B" then 255 else Draft.B)
		slider.Gradient.Color = ColorSequence.new(low, high)
	end
	local van = Snapshot.Van
	local changed = Draft.R ~= van.Paint[1] or Draft.G ~= van.Paint[2] or Draft.B ~= van.Paint[3]
	paintApply.SetText(if changed then ("Respray • %s"):format(formatMoney(Catalogue.Prices.Paint)) else "No changes yet")
	paintApply.SetEnabled(changed and Snapshot.Cash >= Catalogue.Prices.Paint)
end

for index, preset in PAINT_PRESETS do
	local holder = swatch(presetGrid, Color3.fromRGB(preset[2], preset[3], preset[4]), index, false, function()
		Draft.R, Draft.G, Draft.B = preset[2], preset[3], preset[4]
		refreshPaintPage()
		previewPaint(Color3.fromRGB(Draft.R, Draft.G, Draft.B))
	end)
	holder.Name = preset[1]
end

-- Interior Layout --------------------------------------------------------------

local interiorPage = tabPage("Interior")
local CELL = 62
local CELL_GAP = 6
local selectedProp = nil
local rotated = false

label({ Text = "▲ CAB", Font = THEME.Body, Color = THEME.Muted, Size = UDim2.fromOffset(198, 18), Position = UDim2.fromOffset(0, 0), MaxTextSize = 14, ZIndex = 22, Parent = interiorPage })
local gridFrame = make("Frame", {
	Name = "Grid",
	Position = UDim2.fromOffset(0, 22),
	Size = UDim2.fromOffset(3 * CELL + 2 * CELL_GAP, 4 * CELL + 3 * CELL_GAP),
	BackgroundTransparency = 1,
	ZIndex = 22,
	Parent = interiorPage,
})
local rearLabel = label({ Text = "▼ REAR DOORS", Font = THEME.Body, Color = THEME.Muted, Size = UDim2.fromOffset(198, 18), MaxTextSize = 14, ZIndex = 22, Parent = interiorPage })
local interiorHint = label({
	Text = "Pick an item, then tap a cell. Tap a placed item to remove it.",
	Font = THEME.Body,
	Color = THEME.Muted,
	Size = UDim2.fromOffset(198, 52),
	MaxTextSize = 13,
	ZIndex = 22,
	Parent = interiorPage,
})
local rotateButton, rotateControls = button({
	Text = "↻ Rotate: Off",
	Color = THEME.Sky,
	Size = UDim2.fromOffset(198, 40),
	MaxTextSize = 18,
	ZIndex = 22,
	Parent = interiorPage,
	OnClick = function()
		rotated = not rotated
		refreshAll()
	end,
})

local propList = make("ScrollingFrame", {
	Name = "Props",
	Position = UDim2.fromOffset(214, 0),
	Size = UDim2.new(1, -214, 1, 0),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 4,
	CanvasSize = UDim2.new(),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	ZIndex = 22,
	Parent = interiorPage,
})
listLayout(Enum.FillDirection.Vertical, 8).Parent = propList
padding(2, 6, 6, 2).Parent = propList

local function footprintOf(propId, isRotated)
	local def = Catalogue.Props[propId]
	if isRotated then
		return def.D, def.W
	end
	return def.W, def.D
end

local function occupancy()
	local cells = {}
	for index, placement in Snapshot.Van.Layout do
		local cols, rows = footprintOf(placement.Id, placement.R == 1)
		for cx = placement.X, placement.X + cols - 1 do
			for cy = placement.Y, placement.Y + rows - 1 do
				cells[cx .. ":" .. cy] = index
			end
		end
	end
	return cells
end

local cellButtons = {}

local function placementFits(propId, x, y, cells)
	local cols, rows = footprintOf(propId, rotated)
	if x + cols - 1 > Catalogue.Grid.Cols or y + rows - 1 > Catalogue.Grid.Rows then
		return false
	end
	for cx = x, x + cols - 1 do
		for cy = y, y + rows - 1 do
			if cells[cx .. ":" .. cy] then
				return false
			end
		end
	end
	return true
end

local function paintCells(highlight)
	local cells = occupancy()
	for key, cellButton in cellButtons do
		cellButton.BackgroundColor3 = if highlight and highlight[key] ~= nil
			then (if highlight[key] then Color3.fromRGB(150, 235, 160) else Color3.fromRGB(255, 160, 160))
			elseif cells[key] then THEME.CardAlt
			else Color3.fromRGB(205, 212, 226)
	end
end

local function previewFootprint(x, y)
	if not selectedProp then
		return
	end
	local cols, rows = footprintOf(selectedProp, rotated)
	local fits = placementFits(selectedProp, x, y, occupancy())
	local highlight = {}
	for cx = x, math.min(x + cols - 1, Catalogue.Grid.Cols) do
		for cy = y, math.min(y + rows - 1, Catalogue.Grid.Rows) do
			highlight[cx .. ":" .. cy] = fits
		end
	end
	paintCells(highlight)
end

local function buildGrid()
	if next(cellButtons) then
		return
	end
	for col = 1, Catalogue.Grid.Cols do
		for row = 1, Catalogue.Grid.Rows do
			local cellButton = make("TextButton", {
				Name = ("Cell_%d_%d"):format(col, row),
				Text = "",
				AutoButtonColor = false,
				Position = UDim2.fromOffset((col - 1) * (CELL + CELL_GAP), (row - 1) * (CELL + CELL_GAP)),
				Size = UDim2.fromOffset(CELL, CELL),
				BackgroundColor3 = Color3.fromRGB(205, 212, 226),
				ZIndex = 22,
				Parent = gridFrame,
			})
			corner(10).Parent = cellButton
			borderStroke(THEME.Ink, 2).Parent = cellButton
			cellButtons[col .. ":" .. row] = cellButton
			cellButton.MouseEnter:Connect(function()
				previewFootprint(col, row)
			end)
			cellButton.MouseLeave:Connect(function()
				paintCells(nil)
			end)
			cellButton.Activated:Connect(function()
				if not selectedProp then
					playUiSound("Error", 0.9)
					showToast("Pick an item from the list first.", "info")
					return
				end
				playUiSound("Click", 1.2)
				UpgradeVanEvent:FireServer("PlaceProp", { Id = selectedProp, X = col, Y = row, Rotated = rotated })
			end)
		end
	end
	local gridHeight = Catalogue.Grid.Rows * CELL + (Catalogue.Grid.Rows - 1) * CELL_GAP
	gridFrame.Size = UDim2.fromOffset(Catalogue.Grid.Cols * CELL + (Catalogue.Grid.Cols - 1) * CELL_GAP, gridHeight)
	rearLabel.Position = UDim2.fromOffset(0, 26 + gridHeight)
	interiorHint.Position = UDim2.fromOffset(0, 48 + gridHeight)
	rotateButton.Position = UDim2.fromOffset(0, 104 + gridHeight)
end

local function refreshInteriorPage()
	buildGrid()
	rotateControls.SetText(if rotated then "↻ Rotate: On" else "↻ Rotate: Off")

	for _, child in gridFrame:GetChildren() do
		if child.Name == "Placed" then
			child:Destroy()
		end
	end
	for _, placement in Snapshot.Van.Layout do
		local def = Catalogue.Props[placement.Id]
		if def then
			local cols, rows = footprintOf(placement.Id, placement.R == 1)
			local placed = make("TextButton", {
				Name = "Placed",
				Text = "",
				AutoButtonColor = false,
				Position = UDim2.fromOffset((placement.X - 1) * (CELL + CELL_GAP), (placement.Y - 1) * (CELL + CELL_GAP)),
				Size = UDim2.fromOffset(cols * CELL + (cols - 1) * CELL_GAP, rows * CELL + (rows - 1) * CELL_GAP),
				BackgroundColor3 = THEME.Yellow,
				ZIndex = 25,
				Parent = gridFrame,
			})
			corner(12).Parent = placed
			borderStroke(THEME.Ink, 3).Parent = placed
			shine().Parent = placed
			label({ Text = def.Icon, Size = UDim2.new(1, -8, 0.6, 0), Position = UDim2.fromOffset(4, 2), ZIndex = 26, Parent = placed })
			label({
				Text = "✕ remove",
				Font = THEME.Body,
				Color = THEME.Ink,
				Size = UDim2.new(1, -8, 0.3, 0),
				Position = UDim2.new(0, 4, 0.66, 0),
				MaxTextSize = 12,
				ZIndex = 26,
				Parent = placed,
			})
			placed.Activated:Connect(function()
				playUiSound("Click", 0.9)
				UpgradeVanEvent:FireServer("RemoveProp", { X = placement.X, Y = placement.Y })
			end)
		end
	end
	paintCells(nil)

	clearButtons(propList)
	for _, child in propList:GetChildren() do
		if child:IsA("Frame") then
			child:Destroy()
		end
	end
	local placedCounts = {}
	for _, placement in Snapshot.Van.Layout do
		placedCounts[placement.Id] = (placedCounts[placement.Id] or 0) + 1
	end
	for index, id in sortedIds(Catalogue.Props) do
		local def = Catalogue.Props[id]
		local owned = Snapshot.OwnedProps[id] or 0
		local placedCount = placedCounts[id] or 0
		local row = card({
			Size = UDim2.new(1, 0, 0, 96),
			LayoutOrder = index,
			Radius = 14,
			Color = if id == selectedProp then Color3.fromRGB(255, 244, 200) else THEME.Card,
			StrokeColor = if id == selectedProp then THEME.YellowDark else THEME.Ink,
			ZIndex = 22,
			Parent = propList,
		})
		label({ Text = def.Icon, Size = UDim2.fromOffset(40, 40), Position = UDim2.fromOffset(6, 6), ZIndex = 23, Parent = row })
		label({
			Text = def.DisplayName,
			Size = UDim2.new(1, -60, 0, 22),
			Position = UDim2.fromOffset(52, 6),
			AlignX = Enum.TextXAlignment.Left,
			MaxTextSize = 16,
			ZIndex = 23,
			Parent = row,
		})
		label({
			Text = ("%dx%d  •  Owned %d  •  Placed %d"):format(def.W, def.D, owned, placedCount),
			Font = THEME.Body,
			Color = THEME.Muted,
			Size = UDim2.new(1, -60, 0, 18),
			Position = UDim2.fromOffset(52, 28),
			AlignX = Enum.TextXAlignment.Left,
			MaxTextSize = 13,
			ZIndex = 23,
			Parent = row,
		})
		local _, buyControls = button({
			Text = "Buy " .. formatMoney(def.Price),
			Color = THEME.Green,
			Position = UDim2.new(0, 8, 1, -44),
			Size = UDim2.new(0.5, -12, 0, 36),
			MaxTextSize = 15,
			ZIndex = 23,
			Parent = row,
			OnClick = function()
				UpgradeVanEvent:FireServer("BuyProp", { Id = id })
			end,
		})
		buyControls.SetEnabled(Snapshot.Cash >= def.Price)
		local _, selectControls = button({
			Text = if id == selectedProp then "Selected ✓" else "Select",
			Color = if id == selectedProp then THEME.Yellow else THEME.Sky,
			Position = UDim2.new(0.5, 4, 1, -44),
			Size = UDim2.new(0.5, -12, 0, 36),
			MaxTextSize = 15,
			ZIndex = 23,
			Parent = row,
			OnClick = function()
				selectedProp = if selectedProp == id then nil else id
				refreshInteriorPage()
			end,
		})
		selectControls.SetEnabled(owned > placedCount)
	end
end

-- Open / close --------------------------------------------------------------

local inCustomiseZone = false

local function customiserLayout()
	if isPortrait() then
		customiser.AnchorPoint = Vector2.new(0.5, 1)
		customiser.Position = UDim2.new(0.5, 0, 1, -12)
	else
		customiser.AnchorPoint = Vector2.new(0, 0.5)
		customiser.Position = UDim2.new(0, 16, 0.5, 0)
	end
end
table.insert(layoutListeners, customiserLayout)

local function refreshCustomiser()
	if not customiserOpen then
		return
	end
	customiserCash.Text = formatMoney(Snapshot.Cash)
	refreshSignPage()
	refreshPaintPage()
	refreshInteriorPage()
end
table.insert(refreshers, refreshCustomiser)

openCustomiser = function()
	if customiserOpen or not Snapshot or not Catalogue or not inCustomiseZone then
		return
	end
	customiserOpen = true
	resetDraft()
	customiserLayout()
	customiser.Visible = true
	customiserPop.Scale = 0.6
	tween(customiserPop, 0.4, { Scale = 1 }, Enum.EasingStyle.Back)
	playUiSound("Whoosh", 1.1)
	selectTab(currentTab)
	refreshCustomiser()
	CameraFocusSignal:Fire(if currentTab == "Interior" then "VanInterior" else "Van")
	if phoneOpen then
		closePhone()
	end
	customiseButton.Visible = false
end

closeCustomiser = function()
	if not customiserOpen then
		return
	end
	customiserOpen = false
	revertPreviews()
	selectedProp = nil
	tween(customiserPop, 0.2, { Scale = 0 }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
	task.delay(0.21, function()
		if not customiserOpen then
			customiser.Visible = false
		end
	end)
	CameraFocusSignal:Fire(nil)
	customiseButton.Visible = inCustomiseZone
end

--------------------------------------------------------------------------------
-- SERVER MESSAGES
--------------------------------------------------------------------------------

local pendingPhoneApp = nil
local awaitingReveal = false

local function flushPendingPhone()
	if pendingPhoneApp and not cinematicActive and not awaitingReveal then
		local app = pendingPhoneApp
		pendingPhoneApp = nil
		openPhone(app)
	end
end

local function applySnapshot(snapshot)
	if type(snapshot) ~= "table" then
		return
	end
	Snapshot = snapshot
	inCustomiseZone = snapshot.InCustomiseZone == true
	if not customiserOpen then
		customiseButton.Visible = inCustomiseZone
	end
	refreshAll()
end

DataSyncEvent.OnClientEvent:Connect(applySnapshot)

QuestEvent.OnClientEvent:Connect(function(message)
	if type(message) ~= "table" then
		return
	end
	if message.Action == "Stage" then
		if Snapshot then
			Snapshot.TutorialStep = message.Step
			refreshAll()
		end
		if message.Step == 4 then
			openNaming()
		end
	elseif message.Action == "OpenNaming" then
		if Snapshot then
			Snapshot.TutorialStep = 4
		end
		openNaming()
	elseif message.Action == "NameResult" then
		namePending = false
		registerControls.SetEnabled(true)
		registerControls.SetText("Register Company ✓")
		if message.Ok then
			nameError.Text = ""
			awaitingReveal = true
			pendingPhoneApp = pendingPhoneApp or "Ads"
			closeNaming()
			task.delay(9, function()
				if awaitingReveal then
					awaitingReveal = false
					flushPendingPhone()
				end
			end)
		else
			nameError.Text = message.Message or "That name can't be used."
			playUiSound("Error", 0.9)
		end
	elseif message.Action == "OpenPhone" then
		pendingPhoneApp = message.App or "Ads"
		flushPendingPhone()
	elseif message.Action == "KitCollected" then
		openKit(message.Items or {})
	end
end)

UpgradeVanEvent.OnClientEvent:Connect(function(message)
	if type(message) ~= "table" then
		return
	end
	if message.Action == "ZoneEntered" then
		inCustomiseZone = true
		openCustomiser()
	elseif message.Action == "ZoneExited" then
		inCustomiseZone = false
		closeCustomiser()
		customiseButton.Visible = false
	elseif message.Action == "Result" and not message.Ok then
		if message.Request == "SignWriting" or message.Request == "Paint" then
			-- Keep the draft so they can try again once they can afford it.
			playUiSound("Error", 0.9)
		end
	end
end)

CommerceEvent.OnClientEvent:Connect(function(message)
	if type(message) == "table" and message.Ok and message.Action == "BuyAdvert" and phoneOpen then
		task.delay(1.2, closePhone)
	end
end)

CinematicSignal.Event:Connect(function(active)
	cinematicActive = active == true
	hud.Visible = not cinematicActive
	if cinematicActive then
		awaitingReveal = false
		if phoneOpen then
			closePhone()
		end
	else
		flushPendingPhone()
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
	while not Snapshot do
		local ok, result = pcall(SnapshotFunction.InvokeServer, SnapshotFunction)
		if ok and type(result) == "table" then
			applySnapshot(result)
		else
			task.wait(1)
		end
	end
	if Snapshot.TutorialStep == 4 then
		openNaming()
	elseif Snapshot.TutorialStep == 5 then
		pendingPhoneApp = "Ads"
		task.delay(1, flushPendingPhone)
	end
	if Snapshot.InCustomiseZone then
		openCustomiser()
	end
end)
