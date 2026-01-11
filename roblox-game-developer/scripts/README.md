# Roblox Development Helper Scripts

This collection provides essential utilities and managers for Roblox game development, offering robust systems for data management, networking, UI, game flow, and audio.

## Scripts Overview

### 📊 DataManager.lua
**Robust player data persistence system**

```lua
local DataManager = require(ReplicatedStorage.Scripts.DataManager)
DataManager:Initialize()

-- Load player data on join
local playerData = DataManager:LoadPlayerData(player)

-- Update specific data paths
DataManager:UpdatePlayerData(player, "stats.gamesPlayed", 15)
DataManager:AddCurrency(player, "coins", 100)
```

**Features:**
- Automatic retry logic with exponential backoff
- Data migration support for version updates
- Autosave system with configurable intervals
- Safe session data caching
- Graceful shutdown data saving

### 🌐 RemoteManager.lua
**Secure networking with built-in rate limiting**

```lua
local RemoteManager = require(ReplicatedStorage.Scripts.RemoteManager)

-- Create and configure remotes
local purchaseEvent = RemoteManager:CreateRemoteEvent("PurchaseItem", {
    maxCalls = 3,
    timeWindow = 1,
    cooldown = 0.5
})

-- Connect with automatic validation
RemoteManager:ConnectEvent("PurchaseItem", function(player, itemId, quantity)
    -- Server-side logic with automatic rate limiting
end)
```

**Features:**
- Automatic rate limiting per player
- Argument validation schemas
- Organized remote structure
- Built-in security measures
- Common game remotes pre-configured

### 🎨 UIManager.lua
**Modern UI system with animations and theming**

```lua
local UIManager = require(ReplicatedStorage.Scripts.UIManager)

-- Create responsive screens
local mainGui, mainFrame = UIManager:CreateScreen("MainMenu", {
    size = UDim2.fromScale(0.8, 0.6),
    cornerRadius = 12
})

-- Animated elements
local button = UIManager:CreateButton(mainFrame, {
    text = "Play Game",
    onClick = function()
        UIManager:ShowScreen("GameMenu", "slideUp")
    end
})

-- Show notifications
UIManager:ShowNotification("Welcome to the game!", 3, "success")
```

**Features:**
- Dark/light theme support
- Smooth animations with presets
- Responsive design helpers
- Modal dialogs and notifications
- Mobile-optimized components

### 🎮 GameManager.lua
**Complete game state and lifecycle management**

```lua
local GameManager = require(ServerScriptService.GameManager)
GameManager:Initialize()

-- Listen to game events
GameManager:OnStateChanged_Event():Connect(function(oldState, newState)
    print("Game state: " .. oldState .. " -> " .. newState)
end)

-- Handle custom game logic
function GameManager:UpdateGameplay()
    -- Override for game-specific updates
end
```

**Features:**
- Automatic state management (Lobby → Playing → Ended)
- Player lifecycle handling
- Round-based game support
- Score calculation and statistics
- Configurable game parameters

### 🎵 SoundManager.lua
**Professional audio system with spatial support**

```lua
local SoundManager = require(ReplicatedStorage.Scripts.SoundManager)
SoundManager:Initialize()

-- Play categorized sounds
SoundManager:PlaySound(131961136, {
    category = "SFX",
    volume = 0.8,
    fadeIn = 0.5
})

-- Music management
SoundManager:PlayMusic(142376088, {
    crossfade = 2,
    looped = true
})

-- 3D positioned audio
SoundManager:Play3DSound(soundId, Vector3.new(0, 5, 0), {
    volume = 0.6,
    rollOffMode = Enum.RollOffMode.Linear
})
```

**Features:**
- Category-based volume control
- Sound pooling for performance
- Crossfading and smooth transitions
- 3D spatial audio support
- Playlist management

## Setup Instructions

### 1. Server Setup (ServerScriptService)
```lua
-- Main.server.lua
local DataManager = require(ReplicatedStorage.Scripts.DataManager)
local RemoteManager = require(ReplicatedStorage.Scripts.RemoteManager)
local GameManager = require(script.GameManager)

-- Initialize core systems
DataManager:Initialize()
RemoteManager:CreateCommonRemotes()
GameManager:Initialize()
```

### 2. Client Setup (StarterGui)
```lua
-- ClientMain.client.lua
local UIManager = require(ReplicatedStorage.Scripts.UIManager)
local SoundManager = require(ReplicatedStorage.Scripts.SoundManager)

UIManager:SetTheme("dark")
SoundManager:Initialize()

-- Set up UI screens
local mainMenu = UIManager:CreateScreen("MainMenu")
-- ... add UI elements
```

### 3. Recommended Folder Structure
```
ReplicatedStorage/
├── Scripts/
│   ├── DataManager.lua
│   ├── RemoteManager.lua
│   ├── UIManager.lua
│   └── SoundManager.lua
└── Remotes/
    ├── Events/
    └── Functions/

ServerScriptService/
├── Main.server.lua
└── GameManager.lua

StarterGui/
└── ClientMain.client.lua
```

## Integration Examples

### Complete Shop System
```lua
-- Server
RemoteManager:ConnectEvent("PurchaseItem", function(player, itemId)
    local playerData = DataManager:GetPlayerData(player)
    local itemCost = ShopData[itemId].cost
    
    if DataManager:SpendCurrency(player, "coins", itemCost) then
        -- Add item to inventory
        table.insert(playerData.inventory, itemId)
        RemoteManager:FireClient(player, "PurchaseSuccess", itemId)
        SoundManager:PlaySound(successSoundId, {category = "UI"})
    end
end)

-- Client
UIManager:CreateButton(shopFrame, {
    text = "Buy Item",
    onClick = function()
        RemoteManager:GetRemoteEvent("PurchaseItem"):FireServer(selectedItem)
    end
})
```

### Game Round Flow
```lua
-- Extend GameManager for specific game modes
function GameManager:InitializeGameRound()
    -- Spawn objectives, reset player states
    for player in pairs(self:GetActivePlayers()) do
        player.Character.Humanoid.Health = 100
    end
    
    SoundManager:PlayMusic(gameplayMusicId, {
        fadeIn = 1,
        volume = 0.6
    })
end

function GameManager:UpdateGameplay()
    -- Check win conditions, update UI
    local timeLeft = self:GetTimeRemaining()
    RemoteManager:FireAllClients("UpdateTimer", timeLeft)
end
```

## Best Practices

### Performance
- Use object pooling for frequently created/destroyed elements
- Implement proper cleanup in all event connections
- Cache frequently accessed data
- Use heartbeat connections sparingly

### Security
- Always validate data on the server
- Use rate limiting for all remote events
- Never trust client-sent data
- Implement proper anti-exploit measures

### User Experience
- Provide visual feedback for all interactions
- Use consistent animation timing
- Implement proper error handling with user-friendly messages
- Support both mobile and desktop interfaces

## Advanced Features

### Custom Themes
```lua
UIManager.THEMES.custom = {
    background = Color3.fromRGB(20, 30, 40),
    primary = Color3.fromRGB(255, 100, 50),
    -- ... other colors
}
UIManager:SetTheme("custom")
```

### Data Migration
```lua
function DataManager:MigrateData(data)
    if data.version < 2 then
        data.newFeature = {}
        data.version = 2
    end
    return data
end
```

### Custom Sound Categories
```lua
SoundManager.SOUND_CATEGORIES.GAMEPLAY = "Gameplay"
-- Create sounds with new category
SoundManager:LoadSound(soundId, "Gameplay", {name = "explosion"})
```

These scripts provide a solid foundation for any Roblox game, handling the complexity of data management, networking, UI, and audio while maintaining clean, maintainable code.