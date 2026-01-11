-- GameManager.lua - Core game state and lifecycle management
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TeleportService = game:GetService("TeleportService")

-- Import our modules
local DataManager = require(script.Parent.DataManager)
local RemoteManager = require(script.Parent.RemoteManager)

local GameManager = {}
GameManager.__index = GameManager

-- Game states
local GAME_STATES = {
    LOADING = "Loading",
    LOBBY = "Lobby", 
    PLAYING = "Playing",
    ENDED = "Ended",
    MAINTENANCE = "Maintenance"
}

-- Game configuration
local CONFIG = {
    minPlayers = 1,
    maxPlayers = 12,
    roundDuration = 300, -- 5 minutes
    lobbyDuration = 30,
    endDuration = 10,
    mapRotation = true,
    autoRestart = true
}

local currentState = GAME_STATES.LOADING
local gameStartTime = 0
local roundEndTime = 0
local activePlayers = {}
local gameStats = {
    roundsPlayed = 0,
    totalPlayTime = 0,
    peakPlayers = 0
}

-- Events
local stateChanged = Instance.new("BindableEvent")
local playerJoinedGame = Instance.new("BindableEvent")
local playerLeftGame = Instance.new("BindableEvent")

function GameManager:Initialize()
    print("Initializing GameManager...")
    
    -- Initialize dependencies
    DataManager:Initialize()
    RemoteManager:CreateCommonRemotes()
    
    -- Set up remote connections
    self:SetupRemoteConnections()
    
    -- Connect player events
    Players.PlayerAdded:Connect(function(player)
        self:OnPlayerAdded(player)
    end)
    
    Players.PlayerRemoving:Connect(function(player)
        self:OnPlayerRemoving(player)
    end)
    
    -- Start game loop
    self:StartGameLoop()
    
    -- Set initial state
    self:SetState(GAME_STATES.LOBBY)
    
    print("GameManager initialized successfully")
end

function GameManager:SetupRemoteConnections()
    -- Player ready status
    RemoteManager:ConnectEvent("PlayerReady", function(player)
        self:SetPlayerReady(player, true)
    end)
    
    -- Player action handling
    RemoteManager:ConnectEvent("PlayerAction", function(player, actionType, actionData)
        self:HandlePlayerAction(player, actionType, actionData)
    end)
    
    -- Game state requests
    RemoteManager:ConnectFunction("GetGameState", function(player)
        return {
            state = currentState,
            timeRemaining = self:GetTimeRemaining(),
            playerCount = #activePlayers,
            maxPlayers = CONFIG.maxPlayers
        }
    end)
end

function GameManager:OnPlayerAdded(player)
    print("Player " .. player.Name .. " joined the game")
    
    -- Load player data
    local playerData = DataManager:LoadPlayerData(player)
    
    -- Initialize player state
    activePlayers[player] = {
        ready = false,
        joinTime = tick(),
        data = playerData,
        score = 0,
        status = "Alive"
    }
    
    -- Update peak players
    local currentPlayerCount = self:GetPlayerCount()
    if currentPlayerCount > gameStats.peakPlayers then
        gameStats.peakPlayers = currentPlayerCount
    end
    
    -- Send current game state to player
    RemoteManager:FireClient(player, "GameStateUpdate", {
        state = currentState,
        timeRemaining = self:GetTimeRemaining(),
        config = CONFIG
    })
    
    -- Fire event
    playerJoinedGame:Fire(player)
    
    -- Check if we can start the game
    if currentState == GAME_STATES.LOBBY then
        self:CheckStartConditions()
    end
end

function GameManager:OnPlayerRemoving(player)
    print("Player " .. player.Name .. " left the game")
    
    if activePlayers[player] then
        -- Update play time
        local playTime = tick() - activePlayers[player].joinTime
        DataManager:UpdatePlayerData(player, "stats.totalPlayTime", 
            DataManager:GetPlayerData(player).stats.totalPlayTime + playTime)
        
        activePlayers[player] = nil
    end
    
    -- Fire event
    playerLeftGame:Fire(player)
    
    -- Check if game should end due to insufficient players
    if currentState == GAME_STATES.PLAYING then
        self:CheckEndConditions()
    end
end

function GameManager:SetState(newState)
    if currentState == newState then return end
    
    local oldState = currentState
    currentState = newState
    
    print("Game state changed: " .. oldState .. " -> " .. newState)
    
    -- Handle state transitions
    self:OnStateChanged(oldState, newState)
    
    -- Notify players
    RemoteManager:FireAllClients("GameStateUpdate", {
        state = currentState,
        timeRemaining = self:GetTimeRemaining()
    })
    
    -- Fire event
    stateChanged:Fire(oldState, newState)
end

function GameManager:OnStateChanged(oldState, newState)
    if newState == GAME_STATES.LOBBY then
        self:StartLobby()
    elseif newState == GAME_STATES.PLAYING then
        self:StartGame()
    elseif newState == GAME_STATES.ENDED then
        self:EndGame()
    end
end

function GameManager:StartLobby()
    print("Starting lobby phase...")
    
    -- Reset all players to not ready
    for player, playerState in pairs(activePlayers) do
        playerState.ready = false
        playerState.score = 0
        playerState.status = "Alive"
    end
    
    -- Set lobby timer
    roundEndTime = tick() + CONFIG.lobbyDuration
end

function GameManager:StartGame()
    print("Starting game...")
    
    gameStartTime = tick()
    roundEndTime = tick() + CONFIG.roundDuration
    gameStats.roundsPlayed = gameStats.roundsPlayed + 1
    
    -- Teleport players to spawn points
    self:TeleportPlayersToSpawns()
    
    -- Initialize game-specific logic here
    self:InitializeGameRound()
end

function GameManager:EndGame()
    print("Game ended")
    
    -- Calculate game duration
    local gameDuration = tick() - gameStartTime
    gameStats.totalPlayTime = gameStats.totalPlayTime + gameDuration
    
    -- Calculate and award scores
    self:CalculateScores()
    
    -- Update player stats
    for player, playerState in pairs(activePlayers) do
        local playerData = DataManager:GetPlayerData(player)
        playerData.stats.gamesPlayed = playerData.stats.gamesPlayed + 1
        
        -- Award experience based on performance
        local expGained = math.floor(playerState.score / 10) + 50
        DataManager:UpdatePlayerData(player, "experience", playerData.experience + expGained)
        
        -- Award coins
        local coinsGained = math.floor(playerState.score / 5) + 25
        DataManager:AddCurrency(player, "coins", coinsGained)
    end
    
    -- Set end timer
    roundEndTime = tick() + CONFIG.endDuration
    
    -- Show results to players
    self:ShowGameResults()
end

function GameManager:StartGameLoop()
    RunService.Heartbeat:Connect(function()
        self:UpdateGameLoop()
    end)
end

function GameManager:UpdateGameLoop()
    local currentTime = tick()
    
    if currentState == GAME_STATES.LOBBY then
        if currentTime >= roundEndTime then
            if self:CanStartGame() then
                self:SetState(GAME_STATES.PLAYING)
            else
                -- Extend lobby time if not enough players
                roundEndTime = currentTime + 10
            end
        end
    elseif currentState == GAME_STATES.PLAYING then
        if currentTime >= roundEndTime then
            self:SetState(GAME_STATES.ENDED)
        else
            self:UpdateGameplay()
        end
    elseif currentState == GAME_STATES.ENDED then
        if currentTime >= roundEndTime and CONFIG.autoRestart then
            self:SetState(GAME_STATES.LOBBY)
        end
    end
end

function GameManager:UpdateGameplay()
    -- Override this method for game-specific updates
    -- Example: check win conditions, update timers, etc.
end

function GameManager:CheckStartConditions()
    if self:CanStartGame() and currentState == GAME_STATES.LOBBY then
        -- Start countdown or immediate start
        if self:AllPlayersReady() then
            self:SetState(GAME_STATES.PLAYING)
        end
    end
end

function GameManager:CheckEndConditions()
    local alivePlayers = self:GetAlivePlayers()
    
    if #alivePlayers <= 1 and currentState == GAME_STATES.PLAYING then
        self:SetState(GAME_STATES.ENDED)
    elseif #alivePlayers == 0 then
        self:SetState(GAME_STATES.ENDED)
    end
end

function GameManager:CanStartGame()
    return self:GetPlayerCount() >= CONFIG.minPlayers
end

function GameManager:AllPlayersReady()
    for player, playerState in pairs(activePlayers) do
        if not playerState.ready then
            return false
        end
    end
    return true
end

function GameManager:GetPlayerCount()
    local count = 0
    for _ in pairs(activePlayers) do
        count = count + 1
    end
    return count
end

function GameManager:GetAlivePlayers()
    local alive = {}
    for player, playerState in pairs(activePlayers) do
        if playerState.status == "Alive" then
            table.insert(alive, player)
        end
    end
    return alive
end

function GameManager:GetTimeRemaining()
    if roundEndTime == 0 then return 0 end
    return math.max(0, roundEndTime - tick())
end

function GameManager:SetPlayerReady(player, ready)
    if activePlayers[player] then
        activePlayers[player].ready = ready
        print("Player " .. player.Name .. " ready status: " .. tostring(ready))
        
        if currentState == GAME_STATES.LOBBY then
            self:CheckStartConditions()
        end
    end
end

function GameManager:EliminatePlayer(player, reason)
    if activePlayers[player] and activePlayers[player].status == "Alive" then
        activePlayers[player].status = "Eliminated"
        print("Player " .. player.Name .. " eliminated: " .. (reason or "Unknown"))
        
        RemoteManager:FireClient(player, "PlayerEliminated", reason)
        RemoteManager:FireAllClients("PlayerStatusUpdate", player.Name, "Eliminated")
        
        self:CheckEndConditions()
    end
end

function GameManager:HandlePlayerAction(player, actionType, actionData)
    -- Override this method for game-specific action handling
    print("Player " .. player.Name .. " performed action: " .. actionType)
    
    -- Example action handling
    if actionType == "move" then
        -- Validate and process movement
    elseif actionType == "attack" then
        -- Handle combat
    elseif actionType == "interact" then
        -- Handle object interaction
    end
end

function GameManager:TeleportPlayersToSpawns()
    -- Override this method to implement spawn logic
    local spawnPoints = workspace:FindFirstChild("SpawnPoints")
    if not spawnPoints then return end
    
    local spawns = spawnPoints:GetChildren()
    local spawnIndex = 1
    
    for player in pairs(activePlayers) do
        if player.Character and spawns[spawnIndex] then
            player.Character:SetPrimaryPartCFrame(spawns[spawnIndex].CFrame + Vector3.new(0, 5, 0))
            spawnIndex = spawnIndex + 1
            if spawnIndex > #spawns then spawnIndex = 1 end
        end
    end
end

function GameManager:InitializeGameRound()
    -- Override this method for round-specific initialization
end

function GameManager:CalculateScores()
    -- Override this method for game-specific scoring
    for player, playerState in pairs(activePlayers) do
        -- Example scoring: survival time bonus
        local survivalTime = tick() - gameStartTime
        playerState.score = playerState.score + math.floor(survivalTime)
    end
end

function GameManager:ShowGameResults()
    -- Create leaderboard
    local results = {}
    for player, playerState in pairs(activePlayers) do
        table.insert(results, {
            playerName = player.Name,
            score = playerState.score,
            status = playerState.status
        })
    end
    
    -- Sort by score
    table.sort(results, function(a, b) return a.score > b.score end)
    
    -- Send to players
    RemoteManager:FireAllClients("GameResults", results)
end

-- Getters
function GameManager:GetCurrentState()
    return currentState
end

function GameManager:GetActivePlayers()
    return activePlayers
end

function GameManager:GetGameStats()
    return gameStats
end

function GameManager:GetConfig()
    return CONFIG
end

-- Events
function GameManager:OnStateChanged_Event()
    return stateChanged.Event
end

function GameManager:OnPlayerJoinedGame_Event()
    return playerJoinedGame.Event
end

function GameManager:OnPlayerLeftGame_Event()
    return playerLeftGame.Event
end

return GameManager