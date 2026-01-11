# Roblox Performance Optimization Guide

Comprehensive guide for optimizing Roblox games to achieve smooth performance across all devices and player counts.

## 🎯 Performance Fundamentals

### Key Metrics to Monitor

```lua
local PerformanceMonitor = {}
local stats = game:GetService("Stats")
local runService = game:GetService("RunService")

function PerformanceMonitor:GetMetrics()
    return {
        -- Frame Rate
        fps = math.floor(1 / runService.Heartbeat:Wait()),
        
        -- Memory Usage (MB)
        memoryUsage = stats:GetTotalMemoryUsageMb(),
        
        -- Network Stats
        dataReceive = stats.Network.ServerStatsItem["Data Receive"].Value,
        dataSend = stats.Network.ServerStatsItem["Data Send"].Value,
        
        -- Physics Performance
        physicsStepTime = stats.Physics.StepTimeMs.Value,
        
        -- Rendering
        renderTime = stats.Render.RenderTime.Value,
        
        -- Instance Count
        instanceCount = stats.InstanceCount.Value
    }
end

function PerformanceMonitor:LogMetrics()
    local metrics = self:GetMetrics()
    print(string.format("FPS: %d | Memory: %.1fMB | Physics: %.1fms | Instances: %d",
        metrics.fps, metrics.memoryUsage, metrics.physicsStepTime, metrics.instanceCount))
end
```

### Target Performance Guidelines

```lua
local PERFORMANCE_TARGETS = {
    -- Frame Rate (FPS)
    minFPS = 30,    -- Minimum acceptable
    targetFPS = 60, -- Ideal target
    
    -- Memory Usage (MB)
    maxMemoryMobile = 200,  -- Mobile devices
    maxMemoryDesktop = 500, -- Desktop/console
    
    -- Network (KB/s)
    maxDataSend = 10,
    maxDataReceive = 50,
    
    -- Physics Step Time (ms)
    maxPhysicsStep = 16.7, -- ~60 FPS equivalent
    
    -- Instance Limits
    maxInstances = 10000,   -- Total instances
    maxParts = 5000         -- BasePart instances
}
```

---

## 🚀 Script Optimization

### Efficient Loops and Iterations

```lua
-- ❌ Inefficient: Creating unnecessary objects in loops
for i = 1, 1000 do
    local part = Instance.new("Part")
    part.Size = Vector3.new(1, 1, 1)
    part.Position = Vector3.new(i, 0, 0)
    part.Parent = workspace
end

-- ✅ Optimized: Batch operations and yield periodically
local function createPartsOptimized(count)
    local parts = {}
    
    for i = 1, count do
        local part = Instance.new("Part")
        part.Size = Vector3.one
        part.Position = Vector3.new(i, 0, 0)
        table.insert(parts, part)
        
        -- Yield every 10 iterations to prevent lag
        if i % 10 == 0 then
            task.wait()
        end
    end
    
    -- Parent all at once (faster)
    for _, part in ipairs(parts) do
        part.Parent = workspace
    end
end
```

### Object Pooling System

```lua
local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new(createFunction, resetFunction, maxSize)
    return setmetatable({
        createFunc = createFunction,
        resetFunc = resetFunction,
        pool = {},
        maxSize = maxSize or 50,
        activeObjects = {}
    }, ObjectPool)
end

function ObjectPool:Get()
    local object
    
    if #self.pool > 0 then
        object = table.remove(self.pool)
    else
        object = self.createFunc()
    end
    
    table.insert(self.activeObjects, object)
    return object
end

function ObjectPool:Return(object)
    -- Remove from active list
    for i, activeObj in ipairs(self.activeObjects) do
        if activeObj == object then
            table.remove(self.activeObjects, i)
            break
        end
    end
    
    -- Reset object state
    if self.resetFunc then
        self.resetFunc(object)
    end
    
    -- Return to pool if not full
    if #self.pool < self.maxSize then
        table.insert(self.pool, object)
    else
        object:Destroy()
    end
end

-- Example: Projectile pool
local projectilePool = ObjectPool.new(
    function() -- Create function
        local projectile = Instance.new("Part")
        projectile.Size = Vector3.new(0.5, 0.5, 2)
        projectile.Material = Enum.Material.Neon
        
        local bodyVelocity = Instance.new("BodyVelocity")
        bodyVelocity.MaxForce = Vector3.new(4000, 4000, 4000)
        bodyVelocity.Parent = projectile
        
        return projectile
    end,
    function(projectile) -- Reset function
        projectile.Parent = nil
        projectile.Position = Vector3.new(0, 0, 0)
        projectile.BodyVelocity.Velocity = Vector3.new(0, 0, 0)
    end,
    100 -- Max pool size
)
```

### Efficient Event Handling

```lua
-- ❌ Inefficient: Multiple connections for similar events
for _, player in ipairs(game.Players:GetPlayers()) do
    player.CharacterAdded:Connect(function(character)
        -- Handle character spawn
    end)
end

-- ✅ Optimized: Single connection with delegation
local CharacterManager = {}
local characterConnections = {}

function CharacterManager:Init()
    game.Players.PlayerAdded:Connect(function(player)
        player.CharacterAdded:Connect(function(character)
            self:OnCharacterSpawned(player, character)
        end)
        
        player.CharacterRemoving:Connect(function(character)
            self:OnCharacterRemoving(player, character)
        end)
    end)
end

function CharacterManager:OnCharacterSpawned(player, character)
    -- Centralized character handling
    local humanoid = character:WaitForChild("Humanoid")
    
    -- Store connection reference for cleanup
    characterConnections[player] = humanoid.Died:Connect(function()
        self:OnPlayerDied(player)
    end)
end

function CharacterManager:OnCharacterRemoving(player, character)
    -- Clean up connections
    if characterConnections[player] then
        characterConnections[player]:Disconnect()
        characterConnections[player] = nil
    end
end
```

---

## 🎨 Rendering Optimization

### Level of Detail (LOD) System

```lua
local LODManager = {}
local lodObjects = {}
local camera = workspace.CurrentCamera

function LODManager:RegisterObject(object, lodLevels)
    lodObjects[object] = {
        levels = lodLevels, -- {distance = maxDistance, model = model}
        currentLOD = 1,
        basePosition = object.Position
    }
end

function LODManager:Update()
    if not camera then return end
    
    local cameraPosition = camera.CFrame.Position
    
    for object, data in pairs(lodObjects) do
        if object.Parent then
            local distance = (cameraPosition - data.basePosition).Magnitude
            local newLOD = #data.levels
            
            -- Find appropriate LOD level
            for i, level in ipairs(data.levels) do
                if distance <= level.distance then
                    newLOD = i
                    break
                end
            end
            
            -- Switch LOD if changed
            if newLOD ~= data.currentLOD then
                self:SwitchLOD(object, data, newLOD)
            end
        end
    end
end

function LODManager:SwitchLOD(object, data, newLODIndex)
    local newLOD = data.levels[newLODIndex]
    
    -- Hide current model
    if data.levels[data.currentLOD].model then
        data.levels[data.currentLOD].model.Parent = nil
    end
    
    -- Show new model
    if newLOD.model then
        newLOD.model.Parent = object
    end
    
    data.currentLOD = newLODIndex
end

-- Usage example
LODManager:RegisterObject(workspace.Castle, {
    {distance = 100, model = workspace.CastleHighDetail},
    {distance = 500, model = workspace.CastleMediumDetail},
    {distance = 1000, model = workspace.CastleLowDetail}
})

-- Update LOD every frame
game:GetService("RunService").Heartbeat:Connect(function()
    LODManager:Update()
end)
```

### Culling System

```lua
local CullingManager = {}
local culledObjects = {}

function CullingManager:RegisterForCulling(object, maxDistance)
    culledObjects[object] = {
        maxDistance = maxDistance,
        originalParent = object.Parent,
        culled = false
    }
end

function CullingManager:UpdateCulling()
    local camera = workspace.CurrentCamera
    if not camera then return end
    
    local cameraPosition = camera.CFrame.Position
    
    for object, data in pairs(culledObjects) do
        if object.Parent or data.culled then
            local distance = (cameraPosition - object.Position).Magnitude
            local shouldCull = distance > data.maxDistance
            
            if shouldCull and not data.culled then
                -- Cull object
                object.Parent = nil
                data.culled = true
            elseif not shouldCull and data.culled then
                -- Restore object
                object.Parent = data.originalParent
                data.culled = false
            end
        end
    end
end
```

### Material and Texture Optimization

```lua
local MaterialOptimizer = {}

-- Shared materials to reduce memory usage
local OPTIMIZED_MATERIALS = {
    [Enum.Material.Brick] = Enum.Material.Concrete,
    [Enum.Material.Fabric] = Enum.Material.Plastic,
    [Enum.Material.Marble] = Enum.Material.Plastic
}

function MaterialOptimizer:OptimizePart(part)
    -- Reduce material complexity on mobile
    if game:GetService("UserInputService").TouchEnabled then
        local optimizedMaterial = OPTIMIZED_MATERIALS[part.Material]
        if optimizedMaterial then
            part.Material = optimizedMaterial
        end
    end
    
    -- Remove unnecessary properties
    if part.Reflectance > 0.1 then
        part.Reflectance = 0
    end
    
    -- Simplify transparency
    if part.Transparency > 0 and part.Transparency < 1 then
        part.Transparency = math.floor(part.Transparency * 4) / 4 -- Quantize to 0.25 steps
    end
end

function MaterialOptimizer:OptimizeWorkspace()
    for _, descendant in ipairs(workspace:GetDescendants()) do
        if descendant:IsA("BasePart") then
            self:OptimizePart(descendant)
        end
    end
end
```

---

## 🌐 Network Optimization

### Data Compression

```lua
local DataCompressor = {}

function DataCompressor:CompressVector3(vector, precision)
    precision = precision or 100 -- 2 decimal places
    return {
        math.floor(vector.X * precision),
        math.floor(vector.Y * precision),
        math.floor(vector.Z * precision)
    }
end

function DataCompressor:DecompressVector3(compressedData, precision)
    precision = precision or 100
    return Vector3.new(
        compressedData[1] / precision,
        compressedData[2] / precision,
        compressedData[3] / precision
    )
end

function DataCompressor:CompressPlayerData(playerData)
    return {
        p = self:CompressVector3(playerData.position),
        h = math.floor(playerData.health),
        s = math.floor(playerData.score),
        a = playerData.alive and 1 or 0
    }
end

function DataCompressor:DecompressPlayerData(compressedData)
    return {
        position = self:DecompressVector3(compressedData.p),
        health = compressedData.h,
        score = compressedData.s,
        alive = compressedData.a == 1
    }
end
```

### Batch Network Operations

```lua
local NetworkBatcher = {}
local pendingUpdates = {}
local updateInterval = 1/30 -- 30 FPS network updates

function NetworkBatcher:QueueUpdate(updateType, data)
    if not pendingUpdates[updateType] then
        pendingUpdates[updateType] = {}
    end
    table.insert(pendingUpdates[updateType], data)
end

function NetworkBatcher:FlushUpdates()
    for updateType, updates in pairs(pendingUpdates) do
        if #updates > 0 then
            -- Send batched update
            RemoteEvents[updateType]:FireAllClients(updates)
            pendingUpdates[updateType] = {}
        end
    end
end

-- Auto-flush every update interval
spawn(function()
    while true do
        wait(updateInterval)
        NetworkBatcher:FlushUpdates()
    end
end)

-- Usage
NetworkBatcher:QueueUpdate("PlayerPositions", {
    playerId = player.UserId,
    position = DataCompressor:CompressVector3(player.Character.HumanoidRootPart.Position)
})
```

### Smart Update System

```lua
local SmartUpdater = {}
local playerLastUpdates = {}

function SmartUpdater:ShouldUpdate(player, dataType, newValue, threshold)
    local playerId = player.UserId
    
    if not playerLastUpdates[playerId] then
        playerLastUpdates[playerId] = {}
    end
    
    local lastUpdate = playerLastUpdates[playerId][dataType]
    
    -- Always update if first time
    if not lastUpdate then
        playerLastUpdates[playerId][dataType] = {
            value = newValue,
            timestamp = tick()
        }
        return true
    end
    
    -- Check if value changed significantly
    local changed = false
    
    if dataType == "position" then
        local distance = (newValue - lastUpdate.value).Magnitude
        changed = distance > threshold
    elseif dataType == "rotation" then
        local angleDiff = math.abs(newValue - lastUpdate.value)
        changed = angleDiff > threshold
    else
        changed = newValue ~= lastUpdate.value
    end
    
    -- Update if changed or enough time passed
    local timePassed = tick() - lastUpdate.timestamp
    if changed or timePassed > 1.0 then -- Force update after 1 second
        playerLastUpdates[playerId][dataType] = {
            value = newValue,
            timestamp = tick()
        }
        return true
    end
    
    return false
end
```

---

## 🔧 Memory Management

### Instance Cleanup

```lua
local CleanupManager = {}
local trackedInstances = {}

function CleanupManager:TrackInstance(instance, lifetime)
    trackedInstances[instance] = {
        createdTime = tick(),
        lifetime = lifetime
    }
end

function CleanupManager:ForceCleanup(instance)
    if trackedInstances[instance] then
        trackedInstances[instance] = nil
    end
    
    -- Disconnect all connections
    for _, connection in pairs(getconnections(instance)) do
        connection:Disconnect()
    end
    
    -- Destroy instance
    if instance.Parent then
        instance:Destroy()
    end
end

function CleanupManager:Update()
    local currentTime = tick()
    
    for instance, data in pairs(trackedInstances) do
        if not instance.Parent or (currentTime - data.createdTime) > data.lifetime then
            self:ForceCleanup(instance)
        end
    end
end

-- Auto-cleanup every 30 seconds
spawn(function()
    while true do
        wait(30)
        CleanupManager:Update()
    end
end)
```

### Memory Pool System

```lua
local MemoryPool = {}
local pools = {}

function MemoryPool:CreatePool(poolName, objectType, initialSize, maxSize)
    pools[poolName] = {
        objectType = objectType,
        available = {},
        inUse = {},
        maxSize = maxSize or 100
    }
    
    -- Pre-populate pool
    for i = 1, initialSize do
        local object = Instance.new(objectType)
        object.Parent = nil
        table.insert(pools[poolName].available, object)
    end
end

function MemoryPool:GetObject(poolName)
    local pool = pools[poolName]
    if not pool then return nil end
    
    local object
    if #pool.available > 0 then
        object = table.remove(pool.available)
    else
        object = Instance.new(pool.objectType)
    end
    
    table.insert(pool.inUse, object)
    return object
end

function MemoryPool:ReturnObject(poolName, object)
    local pool = pools[poolName]
    if not pool then return end
    
    -- Remove from in-use list
    for i, usedObject in ipairs(pool.inUse) do
        if usedObject == object then
            table.remove(pool.inUse, i)
            break
        end
    end
    
    -- Reset object
    object.Parent = nil
    object.CFrame = CFrame.new()
    
    -- Return to pool if not full
    if #pool.available < pool.maxSize then
        table.insert(pool.available, object)
    else
        object:Destroy()
    end
end

-- Initialize common pools
MemoryPool:CreatePool("Parts", "Part", 20, 50)
MemoryPool:CreatePool("Effects", "Explosion", 5, 10)
```

---

## 📊 Performance Monitoring

### Real-time Performance Dashboard

```lua
local PerformanceDashboard = {}
local gui = nil
local updateConnection = nil

function PerformanceDashboard:Create()
    gui = Instance.new("ScreenGui")
    gui.Name = "PerformanceDashboard"
    gui.Parent = game.Players.LocalPlayer.PlayerGui
    
    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 300, 0, 200)
    frame.Position = UDim2.new(1, -310, 0, 10)
    frame.BackgroundColor3 = Color3.new(0, 0, 0)
    frame.BackgroundTransparency = 0.5
    frame.Parent = gui
    
    -- FPS Display
    local fpsLabel = Instance.new("TextLabel")
    fpsLabel.Size = UDim2.new(1, 0, 0.25, 0)
    fpsLabel.Position = UDim2.new(0, 0, 0, 0)
    fpsLabel.BackgroundTransparency = 1
    fpsLabel.Text = "FPS: --"
    fpsLabel.TextColor3 = Color3.new(1, 1, 1)
    fpsLabel.TextScaled = true
    fpsLabel.Parent = frame
    
    -- Memory Display
    local memoryLabel = Instance.new("TextLabel")
    memoryLabel.Size = UDim2.new(1, 0, 0.25, 0)
    memoryLabel.Position = UDim2.new(0, 0, 0.25, 0)
    memoryLabel.BackgroundTransparency = 1
    memoryLabel.Text = "Memory: --"
    memoryLabel.TextColor3 = Color3.new(1, 1, 1)
    memoryLabel.TextScaled = true
    memoryLabel.Parent = frame
    
    -- Network Display
    local networkLabel = Instance.new("TextLabel")
    networkLabel.Size = UDim2.new(1, 0, 0.25, 0)
    networkLabel.Position = UDim2.new(0, 0, 0.5, 0)
    networkLabel.BackgroundTransparency = 1
    networkLabel.Text = "Network: --"
    networkLabel.TextColor3 = Color3.new(1, 1, 1)
    networkLabel.TextScaled = true
    networkLabel.Parent = frame
    
    -- Instance Count Display
    local instanceLabel = Instance.new("TextLabel")
    instanceLabel.Size = UDim2.new(1, 0, 0.25, 0)
    instanceLabel.Position = UDim2.new(0, 0, 0.75, 0)
    instanceLabel.BackgroundTransparency = 1
    instanceLabel.Text = "Instances: --"
    instanceLabel.TextColor3 = Color3.new(1, 1, 1)
    instanceLabel.TextScaled = true
    instanceLabel.Parent = frame
    
    self.labels = {
        fps = fpsLabel,
        memory = memoryLabel,
        network = networkLabel,
        instances = instanceLabel
    }
end

function PerformanceDashboard:Update()
    if not self.labels then return end
    
    local stats = game:GetService("Stats")
    local runService = game:GetService("RunService")
    
    -- Update FPS
    local fps = math.floor(1 / runService.Heartbeat:Wait())
    local fpsColor = fps >= 45 and Color3.new(0, 1, 0) or (fps >= 30 and Color3.new(1, 1, 0) or Color3.new(1, 0, 0))
    self.labels.fps.Text = "FPS: " .. fps
    self.labels.fps.TextColor3 = fpsColor
    
    -- Update Memory
    local memory = stats:GetTotalMemoryUsageMb()
    local memoryColor = memory < 300 and Color3.new(0, 1, 0) or (memory < 500 and Color3.new(1, 1, 0) or Color3.new(1, 0, 0))
    self.labels.memory.Text = "Memory: " .. math.floor(memory) .. "MB"
    self.labels.memory.TextColor3 = memoryColor
    
    -- Update Network
    local dataSend = stats.Network.ServerStatsItem["Data Send"].Value
    self.labels.network.Text = "Send: " .. math.floor(dataSend) .. "KB/s"
    
    -- Update Instance Count
    local instances = stats.InstanceCount.Value
    self.labels.instances.Text = "Instances: " .. instances
end

function PerformanceDashboard:Start()
    self:Create()
    updateConnection = game:GetService("RunService").Heartbeat:Connect(function()
        self:Update()
    end)
end

function PerformanceDashboard:Stop()
    if updateConnection then
        updateConnection:Disconnect()
        updateConnection = nil
    end
    if gui then
        gui:Destroy()
        gui = nil
    end
end

-- Usage
PerformanceDashboard:Start()
```

### Performance Profiler

```lua
local Profiler = {}
local profiles = {}
local activeProfiles = {}

function Profiler:StartProfile(name)
    activeProfiles[name] = {
        startTime = tick(),
        startMemory = collectgarbage("count")
    }
end

function Profiler:EndProfile(name)
    local active = activeProfiles[name]
    if not active then
        warn("No active profile named: " .. name)
        return
    end
    
    local endTime = tick()
    local endMemory = collectgarbage("count")
    
    if not profiles[name] then
        profiles[name] = {
            calls = 0,
            totalTime = 0,
            totalMemory = 0,
            maxTime = 0,
            minTime = math.huge
        }
    end
    
    local profile = profiles[name]
    local duration = endTime - active.startTime
    local memoryUsed = endMemory - active.startMemory
    
    profile.calls = profile.calls + 1
    profile.totalTime = profile.totalTime + duration
    profile.totalMemory = profile.totalMemory + memoryUsed
    profile.maxTime = math.max(profile.maxTime, duration)
    profile.minTime = math.min(profile.minTime, duration)
    profile.lastTime = duration
    
    activeProfiles[name] = nil
end

function Profiler:GetReport()
    print("=== Performance Profile Report ===")
    for name, data in pairs(profiles) do
        local avgTime = data.totalTime / data.calls
        local avgMemory = data.totalMemory / data.calls
        
        print(string.format("%s:", name))
        print(string.format("  Calls: %d", data.calls))
        print(string.format("  Avg Time: %.3fms", avgTime * 1000))
        print(string.format("  Min/Max Time: %.3f/%.3fms", data.minTime * 1000, data.maxTime * 1000))
        print(string.format("  Avg Memory: %.2fKB", avgMemory))
        print(string.format("  Last Time: %.3fms", (data.lastTime or 0) * 1000))
        print()
    end
end

-- Convenience function for profiling code blocks
function Profiler:Profile(name, func)
    self:StartProfile(name)
    local result = func()
    self:EndProfile(name)
    return result
end

-- Usage example
Profiler:Profile("ExpensiveCalculation", function()
    -- Expensive code here
    for i = 1, 100000 do
        math.sin(i)
    end
end)
```

This performance optimization guide provides comprehensive tools and techniques for maintaining smooth gameplay across all devices and player counts!