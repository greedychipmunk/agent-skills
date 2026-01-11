# Roblox Game Templates

Quick-start templates for common game types with pre-configured systems and mechanics.

## 🎯 Battle Royale Template

### Core Features
- 100 player lobby system
- Shrinking safe zone mechanics
- Weapon and item spawning
- Elimination tracking
- Spectator mode

### Key Components
```lua
-- SafeZone.lua
local SafeZone = {
    radius = 1000,
    center = Vector3.new(0, 0, 0),
    shrinkRate = 5, -- units per second
    damageRate = 10 -- damage per second outside zone
}

function SafeZone:Update()
    self.radius = math.max(50, self.radius - self.shrinkRate)
    self:DamagePlayersOutside()
end

function SafeZone:IsPlayerInside(player)
    local distance = (player.Character.HumanoidRootPart.Position - self.center).Magnitude
    return distance <= self.radius
end
```

### Game Flow
1. **Lobby Phase** - 100 players, 60 second countdown
2. **Spawn Phase** - Players drop from sky, choose landing spots  
3. **Gameplay Phase** - Loot, fight, survive the zone
4. **End Phase** - Last player/team wins

### Required Assets
- Large open map (2000x2000 studs minimum)
- Weapon models with attachments
- Vehicle spawns and fuel system
- Supply drop mechanics
- UI for player count and zone timer

---

## 🏆 Racing Game Template

### Core Features
- Track checkpoints and lap timing
- Vehicle customization system
- Multiplayer races up to 16 players
- Tournament bracket system
- Ghost lap recordings

### Key Components
```lua
-- RaceManager.lua
local RaceManager = {
    maxLaps = 3,
    checkpoints = {},
    playerProgress = {},
    raceState = "Waiting"
}

function RaceManager:CheckPlayerCheckpoint(player, checkpoint)
    local progress = self.playerProgress[player]
    if checkpoint == progress.nextCheckpoint then
        progress.nextCheckpoint = progress.nextCheckpoint + 1
        if progress.nextCheckpoint > #self.checkpoints then
            progress.lap = progress.lap + 1
            progress.nextCheckpoint = 1
            self:CheckRaceEnd(player)
        end
    end
end
```

### Track Requirements
- Start/finish line with detection
- Numbered checkpoint gates
- Pit stop areas for repairs
- Spectator viewing areas
- Safety barriers and run-off zones

### Vehicle System
- Physics-based driving with realistic handling
- Damage system affecting performance
- Fuel consumption and pit stops
- Tire wear and grip levels
- Engine upgrades and tuning

---

## 🏠 Tycoon Template

### Core Features
- Income generation buildings
- Upgrade progression tree
- Resource management
- Player territories
- Automation systems

### Key Components
```lua
-- TycoonManager.lua
local TycoonManager = {
    plots = {},
    buildings = {},
    incomeRate = 1 -- per second
}

function TycoonManager:GenerateIncome(player)
    local tycoon = self.plots[player]
    local income = 0
    
    for _, building in pairs(tycoon.buildings) do
        if building.active then
            income = income + building.incomePerSecond
        end
    end
    
    DataManager:AddCurrency(player, "cash", income)
end
```

### Building Categories
- **Generators**: Basic income sources
- **Processors**: Transform raw materials
- **Upgraders**: Increase efficiency/value
- **Storage**: Hold resources and products
- **Decorative**: Aesthetic improvements

### Progression System
- Unlock new buildings with cash milestones
- Research tree for advanced technologies
- Prestige system for long-term progression
- Achievements for special unlocks

---

## ⚔️ RPG Adventure Template

### Core Features
- Quest system with branching storylines
- Character progression and skill trees
- Inventory and equipment system
- NPC dialogue and shops
- Dungeon instances

### Key Components
```lua
-- QuestManager.lua
local QuestManager = {
    activeQuests = {},
    completedQuests = {},
    questDatabase = {}
}

function QuestManager:StartQuest(player, questId)
    local quest = self.questDatabase[questId]
    if self:CanStartQuest(player, quest) then
        self.activeQuests[player] = self.activeQuests[player] or {}
        table.insert(self.activeQuests[player], quest)
        self:SendQuestUpdate(player, quest)
    end
end
```

### Character System
- **Attributes**: Strength, Dexterity, Intelligence, Vitality
- **Skills**: Combat, Magic, Crafting, Exploration
- **Classes**: Warrior, Mage, Rogue, Healer
- **Equipment**: Weapons, armor, accessories

### World Design
- Multiple regions with level requirements
- Safe zones and dangerous areas
- Fast travel waypoints
- Hidden secrets and easter eggs

---

## 🎮 Platformer Template

### Core Features
- Smooth character movement with coyote time
- Collectible items and power-ups
- Moving platforms and obstacles
- Level progression system
- Time attack and speedrun modes

### Key Components
```lua
-- PlayerController.lua
local PlayerController = {
    jumpForce = 50,
    speed = 16,
    coyoteTime = 0.1,
    jumpBufferTime = 0.1
}

function PlayerController:HandleMovement(player, input)
    local character = player.Character
    local humanoid = character.Humanoid
    local rootPart = character.HumanoidRootPart
    
    -- Apply movement with momentum
    local moveVector = Vector3.new(input.X * self.speed, 0, input.Z * self.speed)
    rootPart.AssemblyLinearVelocity = Vector3.new(moveVector.X, rootPart.AssemblyLinearVelocity.Y, moveVector.Z)
end
```

### Level Elements
- **Platforms**: Static, moving, disappearing
- **Hazards**: Spikes, lava, crushing walls
- **Collectibles**: Coins, gems, power-ups
- **Checkpoints**: Save progress through level
- **Secrets**: Hidden areas and bonus content

### Power-ups
- **Speed Boost**: Temporary faster movement
- **Double Jump**: Extra air mobility
- **Shield**: Protection from one hit
- **Magnet**: Attract nearby collectibles

---

## 🎨 Building/Creative Template

### Core Features
- Grid-based building system
- Material and color selection
- Save/load creations
- Collaborative building
- Showcase galleries

### Key Components
```lua
-- BuildingManager.lua
local BuildingManager = {
    gridSize = 4,
    selectedMaterial = "Plastic",
    selectedColor = Color3.new(1, 1, 1),
    buildMode = true
}

function BuildingManager:PlaceBlock(player, position)
    if not self:CanBuild(player, position) then return end
    
    local block = Instance.new("Part")
    block.Size = Vector3.new(self.gridSize, self.gridSize, self.gridSize)
    block.Position = self:SnapToGrid(position)
    block.Material = Enum.Material[self.selectedMaterial]
    block.Color = self.selectedColor
    block.Parent = workspace
    
    self:SaveBuild(player, block)
end
```

### Building Tools
- **Block Placement**: Various shapes and sizes
- **Terrain Sculpting**: Modify landscape
- **Decoration**: Furniture, props, details
- **Lighting**: Dynamic lighting setup
- **Scripting**: Basic logic blocks

### Sharing System
- **Personal Builds**: Private creations
- **Public Gallery**: Community showcase
- **Collaborative**: Multi-player building
- **Templates**: Reusable structures

---

## 🧩 Puzzle Game Template

### Core Features
- Physics-based puzzle mechanics
- Progressive difficulty scaling
- Hint system for stuck players
- Level editor for custom content
- Achievement tracking

### Key Components
```lua
-- PuzzleManager.lua
local PuzzleManager = {
    currentLevel = 1,
    solved = false,
    moveCount = 0,
    timeLimit = 0
}

function PuzzleManager:CheckSolution()
    local solved = true
    for _, objective in pairs(self.objectives) do
        if not objective:IsComplete() then
            solved = false
            break
        end
    end
    
    if solved and not self.solved then
        self:CompletePuzzle()
    end
end
```

### Puzzle Types
- **Logic Puzzles**: Pattern matching, sequence solving
- **Physics Puzzles**: Object manipulation, gravity
- **Spatial Puzzles**: 3D rotation, perspective
- **Time Puzzles**: Sequential events, timing
- **Math Puzzles**: Number sequences, calculations

---

## 🎲 Casino/Gambling Template

### Core Features
- Virtual currency system
- Multiple casino games
- Daily bonuses and rewards
- Leaderboards and competitions
- VIP tier progression

### Key Components
```lua
-- CasinoManager.lua
local CasinoManager = {
    minimumBet = 10,
    maximumBet = 10000,
    houseEdge = 0.05
}

function CasinoManager:PlaceBet(player, amount, game)
    if not self:ValidateBet(player, amount) then return false end
    
    DataManager:SpendCurrency(player, "chips", amount)
    local result = game:Play(amount)
    
    if result.win then
        DataManager:AddCurrency(player, "chips", result.payout)
    end
    
    return result
end
```

### Games Available
- **Slot Machines**: Various themes and jackpots
- **Blackjack**: Classic card game with strategy
- **Roulette**: American/European variants
- **Poker**: Texas Hold'em tournaments
- **Lottery**: Daily/weekly drawings

**Note**: Ensure compliance with Roblox ToS regarding gambling mechanics.

---

## 📱 Quick Setup Guide

### 1. Choose Template
Select the template that matches your game vision.

### 2. Core Setup
```lua
-- ServerScriptService/GameSetup.lua
local GameManager = require(ReplicatedStorage.Scripts.GameManager)
local DataManager = require(ReplicatedStorage.Scripts.DataManager)

-- Initialize with template config
GameManager:Initialize()
GameManager:SetConfig(TEMPLATE_CONFIG)
```

### 3. Customize
Modify the template scripts for your specific needs:
- Adjust game parameters
- Add unique mechanics
- Create custom UI themes
- Design original assets

### 4. Test & Deploy
- Test with multiple players
- Optimize performance
- Add analytics tracking
- Publish and gather feedback

Each template includes starter assets, configuration files, and detailed documentation to get you building quickly!