# Roblox Debugging & Troubleshooting Guide

Comprehensive guide for debugging Roblox games, from common issues to advanced debugging techniques.

## 🐛 Common Issues & Solutions

### Script Errors

#### "Attempt to index nil with 'X'"
```lua
-- ❌ Problem: Accessing property of nil object
local player = game.Players.LocalPlayer
print(player.Character.Humanoid.Health) -- Error if character doesn't exist

-- ✅ Solution: Nil checking
local player = game.Players.LocalPlayer
if player.Character and player.Character:FindFirstChild("Humanoid") then
    print(player.Character.Humanoid.Health)
end

-- ✅ Better: Use WaitForChild for critical objects
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
print(humanoid.Health)
```

#### "Script timeout: exhausted allowed execution time"
```lua
-- ❌ Problem: Infinite loop without yield
while true do
    -- Heavy computation
    for i = 1, 1000000 do
        math.random()
    end
end

-- ✅ Solution: Add yield points
while true do
    -- Heavy computation
    for i = 1, 1000000 do
        math.random()
        if i % 10000 == 0 then
            task.wait() -- Yield periodically
        end
    end
    task.wait(0.1) -- Always yield at end of loop
end
```

#### "Unable to assign property X. X is not a valid member of Y"
```lua
-- ❌ Problem: Typo in property name
part.Postion = Vector3.new(0, 10, 0) -- Should be "Position"

-- ✅ Solution: Check spelling and use autocomplete
part.Position = Vector3.new(0, 10, 0)

-- ✅ Better: Use property validation
local function setProperty(object, property, value)
    if object[property] then
        object[property] = value
    else
        warn(property .. " is not a valid property of " .. object.ClassName)
    end
end
```

### Performance Issues

#### Frame Rate Drops
```lua
-- ❌ Problem: Creating objects in tight loops
for i = 1, 1000 do
    local part = Instance.new("Part")
    part.Parent = workspace
end

-- ✅ Solution: Batch operations and use pools
local parts = {}
for i = 1, 1000 do
    local part = Instance.new("Part")
    table.insert(parts, part)
    
    -- Yield periodically to prevent lag
    if i % 10 == 0 then
        task.wait()
    end
end

-- Parent all at once
for _, part in ipairs(parts) do
    part.Parent = workspace
end
```

#### Memory Leaks
```lua
-- ❌ Problem: Not disconnecting events
local connection = workspace.ChildAdded:Connect(function(child)
    print(child.Name)
end)

-- Event never gets disconnected, causing memory leak

-- ✅ Solution: Track and disconnect connections
local connections = {}

local function connectEvent(signal, callback)
    local connection = signal:Connect(callback)
    table.insert(connections, connection)
    return connection
end

local function disconnectAll()
    for _, connection in ipairs(connections) do
        connection:Disconnect()
    end
    connections = {}
end
```

---

## 🔍 Debugging Tools

### Built-in Debugging
```lua
-- Developer Console (F9)
-- Use print statements effectively
print("Debug: Player health is", player.Character.Humanoid.Health)
warn("Warning: Low ammunition") -- Shows in yellow
error("Critical error occurred") -- Shows in red and stops execution

-- Conditional debugging
local DEBUG_MODE = true
local function debugPrint(...)
    if DEBUG_MODE then
        print("[DEBUG]", ...)
    end
end

debugPrint("Player entered zone:", zoneName)
```

### Custom Debug Console
```lua
local DebugConsole = {}
local commands = {}

function DebugConsole:AddCommand(name, func, description)
    commands[name] = {
        func = func,
        description = description
    }
end

function DebugConsole:ExecuteCommand(input)
    local parts = string.split(input, " ")
    local commandName = parts[1]
    local args = {unpack(parts, 2)}
    
    if commands[commandName] then
        local success, result = pcall(commands[commandName].func, unpack(args))
        if success then
            print("Command executed:", result or "Success")
        else
            warn("Command failed:", result)
        end
    else
        warn("Unknown command:", commandName)
    end
end

-- Add debug commands
DebugConsole:AddCommand("tp", function(x, y, z)
    local player = game.Players.LocalPlayer
    if player.Character then
        player.Character:SetPrimaryPartCFrame(CFrame.new(tonumber(x), tonumber(y), tonumber(z)))
    end
end, "Teleport to coordinates")

DebugConsole:AddCommand("health", function(amount)
    local player = game.Players.LocalPlayer
    if player.Character and player.Character:FindFirstChild("Humanoid") then
        player.Character.Humanoid.Health = tonumber(amount) or 100
    end
end, "Set health amount")
```

### Performance Profiler
```lua
local Profiler = {}
local profiles = {}

function Profiler:Start(name)
    profiles[name] = {
        startTime = tick(),
        calls = (profiles[name] and profiles[name].calls or 0) + 1
    }
end

function Profiler:End(name)
    if profiles[name] then
        local duration = tick() - profiles[name].startTime
        profiles[name].totalTime = (profiles[name].totalTime or 0) + duration
        profiles[name].lastTime = duration
    end
end

function Profiler:Report()
    print("=== Performance Report ===")
    for name, data in pairs(profiles) do
        local avgTime = data.totalTime / data.calls
        print(string.format("%s: %d calls, %.3fms avg, %.3fms last", 
            name, data.calls, avgTime * 1000, data.lastTime * 1000))
    end
end

-- Usage
Profiler:Start("PlayerUpdate")
-- ... expensive code ...
Profiler:End("PlayerUpdate")
```

---

## 🛠️ Debugging Techniques

### Assertion Testing
```lua
local function assert_type(value, expectedType, name)
    assert(typeof(value) == expectedType, 
        string.format("%s must be a %s, got %s", name, expectedType, typeof(value)))
end

local function assert_range(value, min, max, name)
    assert(value >= min and value <= max,
        string.format("%s must be between %d and %d, got %d", name, min, max, value))
end

-- Usage in functions
function setPlayerHealth(player, health)
    assert_type(player, "Instance", "player")
    assert_type(health, "number", "health")
    assert_range(health, 0, 100, "health")
    
    if player.Character and player.Character:FindFirstChild("Humanoid") then
        player.Character.Humanoid.Health = health
    end
end
```

### Debug Visualizations
```lua
local DebugVis = {}

function DebugVis:DrawRay(origin, direction, color, duration)
    local attachment0 = Instance.new("Attachment")
    local attachment1 = Instance.new("Attachment")
    
    local part = Instance.new("Part")
    part.Name = "DebugRay"
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Position = origin
    part.Parent = workspace
    
    attachment0.Parent = part
    attachment1.Parent = part
    attachment1.Position = Vector3.new(0, 0, -direction.Magnitude)
    
    local beam = Instance.new("Beam")
    beam.Color = ColorSequence.new(color or Color3.new(1, 0, 0))
    beam.Width0 = 0.1
    beam.Width1 = 0.1
    beam.Attachment0 = attachment0
    beam.Attachment1 = attachment1
    beam.Parent = part
    
    part.CFrame = CFrame.lookAt(origin, origin + direction)
    
    -- Clean up after duration
    game:GetService("Debris"):AddItem(part, duration or 5)
end

function DebugVis:DrawSphere(position, radius, color, duration)
    local sphere = Instance.new("Part")
    sphere.Name = "DebugSphere"
    sphere.Shape = Enum.PartType.Ball
    sphere.Size = Vector3.new(radius * 2, radius * 2, radius * 2)
    sphere.Position = position
    sphere.Color = color or Color3.new(1, 0, 0)
    sphere.Anchored = true
    sphere.CanCollide = false
    sphere.Transparency = 0.5
    sphere.Parent = workspace
    
    game:GetService("Debris"):AddItem(sphere, duration or 5)
end
```

### Network Debugging
```lua
local NetworkDebug = {}
local remoteCallCounts = {}
local remoteCallTimes = {}

function NetworkDebug:TrackRemoteEvent(remoteEvent)
    local originalFire = remoteEvent.FireServer
    remoteEvent.FireServer = function(self, ...)
        local name = remoteEvent.Name
        remoteCallCounts[name] = (remoteCallCounts[name] or 0) + 1
        remoteCallTimes[name] = tick()
        
        print(string.format("[REMOTE] %s fired (count: %d)", name, remoteCallCounts[name]))
        return originalFire(self, ...)
    end
end

function NetworkDebug:GetStats()
    print("=== Remote Event Stats ===")
    for name, count in pairs(remoteCallCounts) do
        print(string.format("%s: %d calls, last: %.2fs ago", 
            name, count, tick() - (remoteCallTimes[name] or 0)))
    end
end
```

---

## 🔧 Advanced Debugging

### Stack Trace Analysis
```lua
local function getStackTrace()
    local trace = debug.traceback()
    local lines = string.split(trace, "\n")
    local cleanTrace = {}
    
    for i = 3, #lines do -- Skip first 2 lines (traceback header and this function)
        local line = string.match(lines[i], "^%s*(.+)$") -- Trim whitespace
        if line and line ~= "" then
            table.insert(cleanTrace, line)
        end
    end
    
    return cleanTrace
end

local function logError(message, context)
    local timestamp = os.date("%Y-%m-%d %H:%M:%S")
    local trace = getStackTrace()
    
    print(string.format("[ERROR %s] %s", timestamp, message))
    if context then
        print("Context:", context)
    end
    print("Stack trace:")
    for i, line in ipairs(trace) do
        print(string.format("  %d: %s", i, line))
    end
end

-- Usage
local function riskyFunction()
    local result = pcall(function()
        -- Potentially failing code
        error("Something went wrong!")
    end)
    
    if not result then
        logError("Risky function failed", {
            player = "TestPlayer",
            action = "jump",
            position = Vector3.new(0, 10, 0)
        })
    end
end
```

### Memory Debugging
```lua
local MemoryDebug = {}
local memorySnapshots = {}

function MemoryDebug:TakeSnapshot(name)
    local snapshot = {
        timestamp = tick(),
        instanceCount = 0,
        connectionCount = 0,
        partCount = 0
    }
    
    -- Count instances
    local function countInstances(parent)
        snapshot.instanceCount = snapshot.instanceCount + 1
        if parent:IsA("BasePart") then
            snapshot.partCount = snapshot.partCount + 1
        end
        
        for _, child in ipairs(parent:GetChildren()) do
            countInstances(child)
        end
    end
    
    countInstances(game)
    
    -- Store snapshot
    memorySnapshots[name] = snapshot
    
    print(string.format("Memory snapshot '%s': %d instances, %d parts", 
        name, snapshot.instanceCount, snapshot.partCount))
end

function MemoryDebug:Compare(snapshot1, snapshot2)
    local s1 = memorySnapshots[snapshot1]
    local s2 = memorySnapshots[snapshot2]
    
    if not s1 or not s2 then
        warn("Snapshot not found")
        return
    end
    
    print(string.format("Memory comparison %s -> %s:", snapshot1, snapshot2))
    print(string.format("  Instances: %d (%+d)", s2.instanceCount, s2.instanceCount - s1.instanceCount))
    print(string.format("  Parts: %d (%+d)", s2.partCount, s2.partCount - s1.partCount))
    print(string.format("  Time elapsed: %.2fs", s2.timestamp - s1.timestamp))
end
```

### Remote Event Debugging
```lua
local RemoteDebugger = {}
local eventLogs = {}

function RemoteDebugger:LogEvent(eventName, player, data)
    if not eventLogs[eventName] then
        eventLogs[eventName] = {}
    end
    
    table.insert(eventLogs[eventName], {
        timestamp = tick(),
        player = player.Name,
        data = data,
        stackTrace = debug.traceback()
    })
    
    -- Keep only last 100 logs per event
    if #eventLogs[eventName] > 100 then
        table.remove(eventLogs[eventName], 1)
    end
end

function RemoteDebugger:GetEventHistory(eventName, maxEntries)
    local logs = eventLogs[eventName] or {}
    maxEntries = maxEntries or 10
    
    print(string.format("=== %s Event History ===", eventName))
    local startIndex = math.max(1, #logs - maxEntries + 1)
    
    for i = startIndex, #logs do
        local log = logs[i]
        print(string.format("[%.2fs ago] %s: %s", 
            tick() - log.timestamp, log.player, tostring(log.data)))
    end
end

function RemoteDebugger:FindSpammers(eventName, timeWindow, maxCalls)
    local logs = eventLogs[eventName] or {}
    local currentTime = tick()
    local playerCounts = {}
    
    -- Count recent calls per player
    for _, log in ipairs(logs) do
        if currentTime - log.timestamp <= timeWindow then
            playerCounts[log.player] = (playerCounts[log.player] or 0) + 1
        end
    end
    
    -- Find spammers
    print(string.format("=== %s Spam Analysis (last %.1fs) ===", eventName, timeWindow))
    for player, count in pairs(playerCounts) do
        if count > maxCalls then
            print(string.format("⚠️  %s: %d calls (limit: %d)", player, count, maxCalls))
        end
    end
end
```

---

## 📊 Debugging Best Practices

### Error Handling Patterns
```lua
-- Pattern 1: Graceful degradation
local function safelyGetPlayerData(player)
    local success, data = pcall(function()
        return DataStore:GetAsync(player.UserId)
    end)
    
    if success and data then
        return data
    else
        warn("Failed to load data for " .. player.Name .. ", using defaults")
        return getDefaultPlayerData()
    end
end

-- Pattern 2: Retry with backoff
local function retryOperation(operation, maxRetries, baseDelay)
    for attempt = 1, maxRetries do
        local success, result = pcall(operation)
        if success then
            return result
        else
            if attempt < maxRetries then
                local delay = baseDelay * (2 ^ (attempt - 1)) -- Exponential backoff
                warn(string.format("Operation failed (attempt %d/%d), retrying in %.1fs", 
                    attempt, maxRetries, delay))
                wait(delay)
            else
                error("Operation failed after " .. maxRetries .. " attempts")
            end
        end
    end
end

-- Pattern 3: Circuit breaker
local CircuitBreaker = {}
CircuitBreaker.__index = CircuitBreaker

function CircuitBreaker.new(failureThreshold, timeout)
    return setmetatable({
        failureThreshold = failureThreshold,
        timeout = timeout,
        failures = 0,
        lastFailure = 0,
        state = "closed" -- closed, open, half-open
    }, CircuitBreaker)
end

function CircuitBreaker:call(operation)
    if self.state == "open" then
        if tick() - self.lastFailure > self.timeout then
            self.state = "half-open"
        else
            error("Circuit breaker is open")
        end
    end
    
    local success, result = pcall(operation)
    
    if success then
        self:onSuccess()
        return result
    else
        self:onFailure()
        error(result)
    end
end

function CircuitBreaker:onSuccess()
    self.failures = 0
    self.state = "closed"
end

function CircuitBreaker:onFailure()
    self.failures = self.failures + 1
    self.lastFailure = tick()
    
    if self.failures >= self.failureThreshold then
        self.state = "open"
    end
end
```

### Logging Framework
```lua
local Logger = {}
Logger.LogLevel = {
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4
}

Logger.currentLevel = Logger.LogLevel.INFO
Logger.outputs = {}

function Logger:addOutput(output)
    table.insert(self.outputs, output)
end

function Logger:log(level, message, context)
    if level < self.currentLevel then return end
    
    local levelNames = {"DEBUG", "INFO", "WARN", "ERROR"}
    local timestamp = os.date("%Y-%m-%d %H:%M:%S")
    local logEntry = {
        timestamp = timestamp,
        level = levelNames[level],
        message = message,
        context = context
    }
    
    for _, output in ipairs(self.outputs) do
        output(logEntry)
    end
end

function Logger:debug(message, context)
    self:log(self.LogLevel.DEBUG, message, context)
end

function Logger:info(message, context)
    self:log(self.LogLevel.INFO, message, context)
end

function Logger:warn(message, context)
    self:log(self.LogLevel.WARN, message, context)
end

function Logger:error(message, context)
    self:log(self.LogLevel.ERROR, message, context)
end

-- Console output
Logger:addOutput(function(entry)
    local formatted = string.format("[%s %s] %s", entry.timestamp, entry.level, entry.message)
    if entry.context then
        formatted = formatted .. " | Context: " .. tostring(entry.context)
    end
    print(formatted)
end)
```

This debugging guide provides comprehensive tools and techniques for identifying and fixing issues in your Roblox games efficiently!