-- RemoteManager.lua - Secure remote event/function management
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local RemoteManager = {}
RemoteManager.__index = RemoteManager

local remoteEvents = {}
local remoteFunctions = {}
local rateLimits = {}
local playerCooldowns = {}

-- Rate limiting configuration
local DEFAULT_RATE_LIMIT = {
    maxCalls = 10,
    timeWindow = 1, -- seconds
    cooldown = 0.1 -- minimum time between calls
}

-- Create RemoteEvents and RemoteFunctions folders
local remotesFolder = ReplicatedStorage:FindFirstChild("Remotes")
if not remotesFolder then
    remotesFolder = Instance.new("Folder")
    remotesFolder.Name = "Remotes"
    remotesFolder.Parent = ReplicatedStorage
end

local eventsFolder = remotesFolder:FindFirstChild("Events")
if not eventsFolder then
    eventsFolder = Instance.new("Folder")
    eventsFolder.Name = "Events"
    eventsFolder.Parent = remotesFolder
end

local functionsFolder = remotesFolder:FindFirstChild("Functions")
if not functionsFolder then
    functionsFolder = Instance.new("Folder")
    functionsFolder.Name = "Functions"
    functionsFolder.Parent = remotesFolder
end

function RemoteManager:CreateRemoteEvent(name, rateLimit)
    if remoteEvents[name] then
        return remoteEvents[name]
    end
    
    local remoteEvent = Instance.new("RemoteEvent")
    remoteEvent.Name = name
    remoteEvent.Parent = eventsFolder
    
    remoteEvents[name] = remoteEvent
    rateLimits[name] = rateLimit or DEFAULT_RATE_LIMIT
    playerCooldowns[name] = {}
    
    return remoteEvent
end

function RemoteManager:CreateRemoteFunction(name, rateLimit)
    if remoteFunctions[name] then
        return remoteFunctions[name]
    end
    
    local remoteFunction = Instance.new("RemoteFunction")
    remoteFunction.Name = name
    remoteFunction.Parent = functionsFolder
    
    remoteFunctions[name] = remoteFunction
    rateLimits[name] = rateLimit or DEFAULT_RATE_LIMIT
    playerCooldowns[name] = {}
    
    return remoteFunction
end

function RemoteManager:ConnectEvent(name, callback)
    local remoteEvent = remoteEvents[name]
    if not remoteEvent then
        warn("RemoteEvent '" .. name .. "' not found")
        return
    end
    
    remoteEvent.OnServerEvent:Connect(function(player, ...)
        if self:CheckRateLimit(player, name) then
            local success, error = pcall(callback, player, ...)
            if not success then
                warn("Error in RemoteEvent '" .. name .. "': " .. tostring(error))
            end
        end
    end)
end

function RemoteManager:ConnectFunction(name, callback)
    local remoteFunction = remoteFunctions[name]
    if not remoteFunction then
        warn("RemoteFunction '" .. name .. "' not found")
        return
    end
    
    remoteFunction.OnServerInvoke = function(player, ...)
        if self:CheckRateLimit(player, name) then
            local success, result = pcall(callback, player, ...)
            if success then
                return result
            else
                warn("Error in RemoteFunction '" .. name .. "': " .. tostring(result))
                return nil
            end
        else
            return nil
        end
    end
end

function RemoteManager:FireClient(player, eventName, ...)
    local remoteEvent = remoteEvents[eventName]
    if remoteEvent then
        remoteEvent:FireClient(player, ...)
    else
        warn("RemoteEvent '" .. eventName .. "' not found")
    end
end

function RemoteManager:FireAllClients(eventName, ...)
    local remoteEvent = remoteEvents[eventName]
    if remoteEvent then
        remoteEvent:FireAllClients(...)
    else
        warn("RemoteEvent '" .. eventName .. "' not found")
    end
end

function RemoteManager:CheckRateLimit(player, remoteName)
    local userId = player.UserId
    local limit = rateLimits[remoteName]
    local currentTime = tick()
    
    -- Initialize player cooldown data
    if not playerCooldowns[remoteName][userId] then
        playerCooldowns[remoteName][userId] = {
            lastCall = 0,
            callHistory = {}
        }
    end
    
    local playerData = playerCooldowns[remoteName][userId]
    
    -- Check cooldown
    if currentTime - playerData.lastCall < limit.cooldown then
        warn("Player " .. player.Name .. " hit cooldown for " .. remoteName)
        return false
    end
    
    -- Clean old call history
    local cutoff = currentTime - limit.timeWindow
    local newHistory = {}
    for _, callTime in ipairs(playerData.callHistory) do
        if callTime > cutoff then
            table.insert(newHistory, callTime)
        end
    end
    playerData.callHistory = newHistory
    
    -- Check rate limit
    if #playerData.callHistory >= limit.maxCalls then
        warn("Player " .. player.Name .. " hit rate limit for " .. remoteName)
        return false
    end
    
    -- Record this call
    table.insert(playerData.callHistory, currentTime)
    playerData.lastCall = currentTime
    
    return true
end

function RemoteManager:ValidateArguments(args, schema)
    if #args ~= #schema then
        return false, "Argument count mismatch"
    end
    
    for i, expectedType in ipairs(schema) do
        local argType = typeof(args[i])
        if argType ~= expectedType then
            return false, "Argument " .. i .. " expected " .. expectedType .. ", got " .. argType
        end
    end
    
    return true
end

function RemoteManager:SetCustomRateLimit(remoteName, maxCalls, timeWindow, cooldown)
    if rateLimits[remoteName] then
        rateLimits[remoteName] = {
            maxCalls = maxCalls,
            timeWindow = timeWindow,
            cooldown = cooldown or 0
        }
    end
end

function RemoteManager:GetRemoteEvent(name)
    return remoteEvents[name]
end

function RemoteManager:GetRemoteFunction(name)
    return remoteFunctions[name]
end

-- Common remote events for most games
function RemoteManager:CreateCommonRemotes()
    -- Player data events
    self:CreateRemoteEvent("UpdatePlayerData", {maxCalls = 5, timeWindow = 1, cooldown = 0.2})
    self:CreateRemoteEvent("RequestPlayerData", {maxCalls = 1, timeWindow = 5, cooldown = 1})
    
    -- Shop/Economy events
    self:CreateRemoteEvent("PurchaseItem", {maxCalls = 3, timeWindow = 1, cooldown = 0.5})
    self:CreateRemoteEvent("SellItem", {maxCalls = 5, timeWindow = 1, cooldown = 0.2})
    
    -- Gameplay events
    self:CreateRemoteEvent("PlayerAction", {maxCalls = 20, timeWindow = 1, cooldown = 0.05})
    self:CreateRemoteEvent("UpdatePosition", {maxCalls = 60, timeWindow = 1, cooldown = 0})
    
    -- Chat/Social events
    self:CreateRemoteEvent("SendMessage", {maxCalls = 2, timeWindow = 1, cooldown = 0.5})
    self:CreateRemoteEvent("PlayerInteraction", {maxCalls = 10, timeWindow = 1, cooldown = 0.1})
    
    -- UI events
    self:CreateRemoteEvent("UIAction", {maxCalls = 15, timeWindow = 1, cooldown = 0.1})
    
    -- Functions for data requests
    self:CreateRemoteFunction("GetShopData", {maxCalls = 1, timeWindow = 2, cooldown = 1})
    self:CreateRemoteFunction("ValidateAction", {maxCalls = 10, timeWindow = 1, cooldown = 0.1})
end

return RemoteManager