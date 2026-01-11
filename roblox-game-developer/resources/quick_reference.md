# Roblox Quick Reference Guide

Essential commands, snippets, and references for rapid Roblox development.

## 🎯 Essential Services

```lua
-- Core Services (Most Common)
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterGui = game:GetService("StarterGui")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

-- Data & Networking
local DataStoreService = game:GetService("DataStoreService")
local RemoteEvents = game:GetService("ReplicatedStorage"):WaitForChild("RemoteEvents")

-- Input & UI
local ContextActionService = game:GetService("ContextActionService")
local GuiService = game:GetService("GuiService")
local TextService = game:GetService("TextService")

-- Audio & Visual
local SoundService = game:GetService("SoundService")
local Lighting = game:GetService("Lighting")
local Debris = game:GetService("Debris")

-- Game Mechanics
local TeleportService = game:GetService("TeleportService")
local MarketplaceService = game:GetService("MarketplaceService")
local BadgeService = game:GetService("BadgeService")
```

## 🔧 Common Snippets

### Player Management
```lua
-- Get local player (client only)
local player = Players.LocalPlayer

-- Wait for character
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local rootPart = character:WaitForChild("HumanoidRootPart")

-- Player events
Players.PlayerAdded:Connect(function(player)
    print(player.Name .. " joined!")
end)

Players.PlayerRemoving:Connect(function(player)
    print(player.Name .. " left!")
end)

-- Character events
player.CharacterAdded:Connect(function(character)
    local humanoid = character:WaitForChild("Humanoid")
    humanoid.Died:Connect(function()
        print(player.Name .. " died!")
    end)
end)
```

### Instance Creation
```lua
-- Basic part creation
local part = Instance.new("Part")
part.Name = "MyPart"
part.Size = Vector3.new(4, 1, 2)
part.Position = Vector3.new(0, 5, 0)
part.BrickColor = BrickColor.new("Bright red")
part.Material = Enum.Material.Plastic
part.Shape = Enum.PartType.Block
part.Parent = workspace

-- UI creation
local screenGui = Instance.new("ScreenGui")
screenGui.Parent = player.PlayerGui

local frame = Instance.new("Frame")
frame.Size = UDim2.fromScale(0.5, 0.5)
frame.Position = UDim2.fromScale(0.25, 0.25)
frame.BackgroundColor3 = Color3.fromRGB(100, 100, 100)
frame.Parent = screenGui
```

### Common Connections
```lua
-- Heartbeat (every frame)
RunService.Heartbeat:Connect(function()
    -- Code here runs every frame
end)

-- Input handling
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    
    if input.KeyCode == Enum.KeyCode.Space then
        print("Space pressed!")
    end
end)

-- Part touched
part.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
    if humanoid then
        local player = Players:GetPlayerFromCharacter(hit.Parent)
        if player then
            print(player.Name .. " touched the part!")
        end
    end
end)
```

---

## 📊 Data Types Reference

### Vector3 Operations
```lua
-- Creation
local pos = Vector3.new(10, 5, -3)
local zero = Vector3.zero
local one = Vector3.one  -- (1, 1, 1)

-- Operations
local distance = (pos1 - pos2).Magnitude
local direction = (target - start).Unit
local midpoint = (pos1 + pos2) / 2
local scaled = pos * 2

-- Common vectors
Vector3.new(0, 1, 0)   -- Up
Vector3.new(0, -1, 0)  -- Down
Vector3.new(1, 0, 0)   -- Right
Vector3.new(-1, 0, 0)  -- Left
Vector3.new(0, 0, 1)   -- Forward
Vector3.new(0, 0, -1)  -- Backward
```

### CFrame Operations
```lua
-- Creation
local cf = CFrame.new(x, y, z)
local lookAt = CFrame.lookAt(position, target)
local angles = CFrame.Angles(math.rad(x), math.rad(y), math.rad(z))

-- Combining
local combined = CFrame.new(position) * CFrame.Angles(0, math.rad(90), 0)

-- Properties
local position = cf.Position
local lookVector = cf.LookVector
local rightVector = cf.RightVector
local upVector = cf.UpVector

-- Relative positioning
local inFront = cf + cf.LookVector * 5
local above = cf + cf.UpVector * 3
local toTheRight = cf + cf.RightVector * 2
```

### UDim2 for UI
```lua
-- Absolute sizing
UDim2.new(0, 200, 0, 100)  -- 200px wide, 100px tall

-- Relative sizing
UDim2.fromScale(0.5, 0.3)  -- 50% width, 30% height

-- Mixed sizing
UDim2.new(0.5, 10, 1, -50)  -- 50% + 10px wide, 100% - 50px tall

-- Common positions
UDim2.fromScale(0, 0)      -- Top-left
UDim2.fromScale(0.5, 0.5)  -- Center
UDim2.fromScale(1, 1)      -- Bottom-right
```

### Color3 Values
```lua
-- RGB (0-255)
Color3.fromRGB(255, 0, 0)    -- Red
Color3.fromRGB(0, 255, 0)    -- Green
Color3.fromRGB(0, 0, 255)    -- Blue

-- HSV (Hue: 0-360, Saturation: 0-1, Value: 0-1)
Color3.fromHSV(0, 1, 1)      -- Red
Color3.fromHSV(120, 1, 1)    -- Green
Color3.fromHSV(240, 1, 1)    -- Blue

-- Predefined colors
Color3.new(1, 1, 1)          -- White
Color3.new(0, 0, 0)          -- Black
Color3.new(0.5, 0.5, 0.5)    -- Gray
```

---

## ⚡ Quick Functions

### Math Utilities
```lua
-- Clamp value between min and max
function clamp(value, min, max)
    return math.max(min, math.min(max, value))
end

-- Lerp between two values
function lerp(a, b, t)
    return a + (b - a) * t
end

-- Round to nearest integer
function round(x)
    return math.floor(x + 0.5)
end

-- Convert degrees to radians
function deg2rad(degrees)
    return degrees * math.pi / 180
end

-- Convert radians to degrees  
function rad2deg(radians)
    return radians * 180 / math.pi
end

-- Random float between min and max
function randomFloat(min, max)
    return min + math.random() * (max - min)
end
```

### String Utilities
```lua
-- Split string by delimiter
function split(str, delimiter)
    local result = {}
    for match in string.gmatch(str, "[^" .. delimiter .. "]+") do
        table.insert(result, match)
    end
    return result
end

-- Check if string starts with prefix
function startsWith(str, prefix)
    return string.sub(str, 1, string.len(prefix)) == prefix
end

-- Check if string ends with suffix
function endsWith(str, suffix)
    return string.sub(str, -string.len(suffix)) == suffix
end

-- Format time as MM:SS
function formatTime(seconds)
    local mins = math.floor(seconds / 60)
    local secs = seconds % 60
    return string.format("%02d:%02d", mins, secs)
end
```

### Table Utilities
```lua
-- Check if table contains value
function contains(table, value)
    for _, v in ipairs(table) do
        if v == value then return true end
    end
    return false
end

-- Get random element from table
function randomChoice(table)
    if #table == 0 then return nil end
    return table[math.random(1, #table)]
end

-- Shallow copy table
function shallowCopy(original)
    local copy = {}
    for key, value in pairs(original) do
        copy[key] = value
    end
    return copy
end

-- Remove element from array
function removeElement(table, element)
    for i, v in ipairs(table) do
        if v == element then
            table.remove(table, i)
            return true
        end
    end
    return false
end
```

---

## 🎨 Animation Shortcuts

### Basic Tweening
```lua
-- Move part smoothly
local part = workspace.Part
local targetCFrame = part.CFrame + Vector3.new(10, 0, 0)

local tween = TweenService:Create(
    part,
    TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    {CFrame = targetCFrame}
)
tween:Play()

-- Fade UI element
local frame = script.Parent
local fadeTween = TweenService:Create(
    frame,
    TweenInfo.new(1, Enum.EasingStyle.Linear),
    {BackgroundTransparency = 1}
)
fadeTween:Play()
```

### Easing Styles Quick Reference
```lua
-- Common easing styles
Enum.EasingStyle.Linear     -- Constant speed
Enum.EasingStyle.Quad       -- Gentle acceleration/deceleration
Enum.EasingStyle.Cubic      -- More pronounced curve
Enum.EasingStyle.Quart      -- Strong curve
Enum.EasingStyle.Bounce     -- Bouncy effect
Enum.EasingStyle.Elastic    -- Spring-like motion
Enum.EasingStyle.Back       -- Slight overshoot
Enum.EasingStyle.Sine       -- Smooth sine wave

-- Easing directions
Enum.EasingDirection.In     -- Start slow, end fast
Enum.EasingDirection.Out    -- Start fast, end slow
Enum.EasingDirection.InOut  -- Slow at both ends
```

---

## 🔊 Audio Quick Setup

```lua
-- Create and play sound
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://123456789"
sound.Volume = 0.5
sound.Pitch = 1
sound.Parent = workspace -- or specific part for 3D audio
sound:Play()

-- Play sound once and destroy
local function playSound(soundId, volume, parent)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxassetid://" .. soundId
    sound.Volume = volume or 1
    sound.Parent = parent or workspace
    sound:Play()
    
    sound.Ended:Connect(function()
        sound:Destroy()
    end)
end

-- Background music loop
local music = Instance.new("Sound")
music.SoundId = "rbxassetid://123456789"
music.Volume = 0.3
music.Looped = true
music.Parent = workspace
music:Play()
```

---

## 📱 Input Handling

### Keyboard Input
```lua
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    
    -- Common key codes
    if input.KeyCode == Enum.KeyCode.W then
        -- Move forward
    elseif input.KeyCode == Enum.KeyCode.Space then
        -- Jump
    elseif input.KeyCode == Enum.KeyCode.E then
        -- Interact
    elseif input.KeyCode == Enum.KeyCode.Tab then
        -- Toggle menu
    elseif input.KeyCode == Enum.KeyCode.LeftShift then
        -- Sprint
    end
end)
```

### Mouse Input
```lua
local mouse = Players.LocalPlayer:GetMouse()

-- Mouse click
mouse.Button1Down:Connect(function()
    print("Left click at:", mouse.Hit.Position)
end)

-- Mouse movement
mouse.Moved:Connect(function()
    local target = mouse.Target
    if target then
        print("Hovering over:", target.Name)
    end
end)
```

### Touch Input (Mobile)
```lua
UserInputService.TouchStarted:Connect(function(touch, gameProcessed)
    if gameProcessed then return end
    print("Touch started at:", touch.Position)
end)

UserInputService.TouchMoved:Connect(function(touch, gameProcessed)
    if gameProcessed then return end
    print("Touch moved to:", touch.Position)
end)

UserInputService.TouchEnded:Connect(function(touch, gameProcessed)
    if gameProcessed then return end
    print("Touch ended")
end)
```

---

## 🎯 Physics & Collision

### Raycasting
```lua
-- Basic raycast
local function raycast(origin, direction, length, filter)
    local raycastParams = RaycastParams.new()
    raycastParams.FilterDescendantsInstances = filter or {}
    raycastParams.FilterType = Enum.RaycastFilterType.Blacklist
    
    local result = workspace:Raycast(origin, direction.Unit * length, raycastParams)
    return result
end

-- Usage
local origin = character.HumanoidRootPart.Position
local direction = character.HumanoidRootPart.CFrame.LookVector
local hit = raycast(origin, direction, 50, {character})

if hit then
    print("Hit:", hit.Instance.Name, "at", hit.Position)
end
```

### Collision Detection
```lua
-- Check if parts are touching
local function arePartsTouching(part1, part2)
    return part1:GetTouchingParts()[part2] ~= nil
end

-- Get all parts in region
local function getPartsInRegion(region)
    return workspace:ReadVoxels(region, 4)
end

-- Check if point is inside part
local function isPointInsidePart(point, part)
    local relativePoint = part.CFrame:PointToObjectSpace(point)
    local halfSize = part.Size / 2
    
    return math.abs(relativePoint.X) <= halfSize.X and
           math.abs(relativePoint.Y) <= halfSize.Y and
           math.abs(relativePoint.Z) <= halfSize.Z
end
```

---

## 🛡️ Error Handling

### Safe Function Calls
```lua
-- pcall (protected call)
local success, result = pcall(function()
    return riskyFunction()
end)

if success then
    print("Function succeeded:", result)
else
    warn("Function failed:", result)
end

-- Retry with backoff
local function retryFunction(func, maxRetries, delay)
    for i = 1, maxRetries do
        local success, result = pcall(func)
        if success then
            return result
        elseif i < maxRetries then
            wait(delay * i) -- Increasing delay
        end
    end
    error("Function failed after " .. maxRetries .. " retries")
end
```

### Common Error Patterns
```lua
-- Nil checking
if object and object.Parent then
    -- Safe to use object
end

-- Type checking
if typeof(value) == "number" then
    -- Safe to do math
end

-- Instance validation
if instance and instance:IsA("Part") then
    -- Safe to treat as part
end

-- Service availability
local success, service = pcall(function()
    return game:GetService("DataStoreService")
end)

if success then
    -- Service is available
end
```

---

## 📋 Common Patterns

### Singleton Pattern
```lua
local MyManager = {}
local instance = nil

function MyManager.getInstance()
    if not instance then
        instance = {
            data = {},
            initialized = false
        }
        setmetatable(instance, {__index = MyManager})
    end
    return instance
end

function MyManager:initialize()
    if not self.initialized then
        -- Setup code here
        self.initialized = true
    end
end
```

### Observer Pattern
```lua
local EventEmitter = {}
EventEmitter.__index = EventEmitter

function EventEmitter.new()
    return setmetatable({
        listeners = {}
    }, EventEmitter)
end

function EventEmitter:on(event, callback)
    if not self.listeners[event] then
        self.listeners[event] = {}
    end
    table.insert(self.listeners[event], callback)
end

function EventEmitter:emit(event, ...)
    if self.listeners[event] then
        for _, callback in ipairs(self.listeners[event]) do
            callback(...)
        end
    end
end
```

### State Machine
```lua
local StateMachine = {}
StateMachine.__index = StateMachine

function StateMachine.new(states, initial)
    return setmetatable({
        states = states,
        current = initial,
        previous = nil
    }, StateMachine)
end

function StateMachine:setState(newState)
    if self.states[newState] then
        local oldState = self.current
        
        -- Exit current state
        if self.states[self.current].exit then
            self.states[self.current].exit()
        end
        
        self.previous = self.current
        self.current = newState
        
        -- Enter new state
        if self.states[newState].enter then
            self.states[newState].enter()
        end
        
        print("State changed:", oldState, "->", newState)
    end
end
```

This quick reference guide provides instant access to the most commonly used Roblox development patterns and snippets!