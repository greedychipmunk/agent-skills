-- DataManager.lua - Robust player data management system
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local DataManager = {}
DataManager.__index = DataManager

local AUTOSAVE_INTERVAL = 30 -- seconds
local MAX_RETRIES = 3
local RETRY_DELAY = 1

-- Default player data template
local DEFAULT_DATA = {
    level = 1,
    experience = 0,
    coins = 100,
    gems = 0,
    inventory = {},
    settings = {
        musicVolume = 1,
        sfxVolume = 1,
        graphics = "Medium"
    },
    stats = {
        gamesPlayed = 0,
        totalPlayTime = 0,
        lastLogin = 0
    },
    achievements = {},
    version = 1 -- for data migration
}

-- Session data cache
local sessionData = {}
local dataStore = DataStoreService:GetDataStore("PlayerData_v2")
local autosaveConnection

function DataManager:LoadPlayerData(player)
    local userId = player.UserId
    local success, data
    
    -- Retry logic for loading data
    for attempt = 1, MAX_RETRIES do
        success, data = pcall(function()
            return dataStore:GetAsync(userId)
        end)
        
        if success then
            break
        else
            warn("Failed to load data for " .. player.Name .. " (attempt " .. attempt .. "): " .. tostring(data))
            if attempt < MAX_RETRIES then
                wait(RETRY_DELAY * attempt)
            end
        end
    end
    
    -- Use loaded data or create default
    if success and data then
        sessionData[userId] = self:MigrateData(data)
        print("Loaded data for " .. player.Name)
    else
        sessionData[userId] = self:DeepCopy(DEFAULT_DATA)
        sessionData[userId].stats.lastLogin = os.time()
        warn("Using default data for " .. player.Name)
    end
    
    return sessionData[userId]
end

function DataManager:SavePlayerData(player)
    local userId = player.UserId
    local data = sessionData[userId]
    
    if not data then
        warn("No session data found for " .. player.Name)
        return false
    end
    
    -- Update last save time
    data.stats.lastSave = os.time()
    
    local success
    for attempt = 1, MAX_RETRIES do
        success = pcall(function()
            dataStore:SetAsync(userId, data)
        end)
        
        if success then
            print("Saved data for " .. player.Name)
            break
        else
            warn("Failed to save data for " .. player.Name .. " (attempt " .. attempt .. ")")
            if attempt < MAX_RETRIES then
                wait(RETRY_DELAY * attempt)
            end
        end
    end
    
    return success
end

function DataManager:GetPlayerData(player)
    return sessionData[player.UserId]
end

function DataManager:UpdatePlayerData(player, path, value)
    local data = sessionData[player.UserId]
    if not data then return false end
    
    -- Support nested path updates (e.g., "stats.gamesPlayed")
    local keys = string.split(path, ".")
    local current = data
    
    for i = 1, #keys - 1 do
        if not current[keys[i]] then
            current[keys[i]] = {}
        end
        current = current[keys[i]]
    end
    
    current[keys[#keys]] = value
    return true
end

function DataManager:AddCurrency(player, currencyType, amount)
    local data = sessionData[player.UserId]
    if not data then return false end
    
    if data[currencyType] then
        data[currencyType] = data[currencyType] + amount
        return true
    end
    return false
end

function DataManager:SpendCurrency(player, currencyType, amount)
    local data = sessionData[player.UserId]
    if not data then return false end
    
    if data[currencyType] and data[currencyType] >= amount then
        data[currencyType] = data[currencyType] - amount
        return true
    end
    return false
end

function DataManager:MigrateData(data)
    -- Handle data version migrations
    if data.version < 1 then
        -- Add new fields introduced in version 1
        data.gems = data.gems or 0
        data.achievements = data.achievements or {}
        data.version = 1
    end
    
    return data
end

function DataManager:DeepCopy(original)
    local copy = {}
    for key, value in pairs(original) do
        if type(value) == "table" then
            copy[key] = self:DeepCopy(value)
        else
            copy[key] = value
        end
    end
    return copy
end

function DataManager:StartAutosave()
    if autosaveConnection then
        autosaveConnection:Disconnect()
    end
    
    autosaveConnection = task.spawn(function()
        while true do
            wait(AUTOSAVE_INTERVAL)
            for _, player in pairs(Players:GetPlayers()) do
                if sessionData[player.UserId] then
                    self:SavePlayerData(player)
                end
            end
        end
    end)
end

function DataManager:OnPlayerRemoving(player)
    self:SavePlayerData(player)
    sessionData[player.UserId] = nil
end

function DataManager:Initialize()
    -- Connect to player events
    Players.PlayerAdded:Connect(function(player)
        self:LoadPlayerData(player)
    end)
    
    Players.PlayerRemoving:Connect(function(player)
        self:OnPlayerRemoving(player)
    end)
    
    -- Start autosave system
    self:StartAutosave()
    
    -- Save all data on server shutdown
    game:BindToClose(function()
        for _, player in pairs(Players:GetPlayers()) do
            self:SavePlayerData(player)
        end
        wait(2) -- Give time for saves to complete
    end)
end

return DataManager