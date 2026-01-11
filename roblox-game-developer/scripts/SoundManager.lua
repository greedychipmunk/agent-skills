-- SoundManager.lua - Comprehensive audio management system
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local SoundManager = {}
SoundManager.__index = SoundManager

-- Sound categories for organization and volume control
local SOUND_CATEGORIES = {
    MUSIC = "Music",
    SFX = "SFX", 
    UI = "UI",
    AMBIENT = "Ambient",
    VOICE = "Voice"
}

-- Audio pools for efficient sound management
local soundPools = {}
local activeSounds = {}
local musicQueue = {}
local currentMusic = nil

-- Volume settings (0-1)
local volumeSettings = {
    [SOUND_CATEGORIES.MUSIC] = 0.7,
    [SOUND_CATEGORIES.SFX] = 1.0,
    [SOUND_CATEGORIES.UI] = 0.8,
    [SOUND_CATEGORIES.AMBIENT] = 0.5,
    [SOUND_CATEGORIES.VOICE] = 1.0,
    master = 1.0
}

-- Sound library for easy reference
local soundLibrary = {
    music = {},
    sfx = {},
    ui = {},
    ambient = {},
    voice = {}
}

function SoundManager:Initialize()
    print("Initializing SoundManager...")
    
    -- Create sound groups for better organization
    self:CreateSoundGroups()
    
    -- Initialize sound pools
    for category, _ in pairs(SOUND_CATEGORIES) do
        soundPools[category] = {}
        activeSounds[category] = {}
    end
    
    -- Load default sounds if they exist
    self:LoadDefaultSounds()
    
    print("SoundManager initialized")
end

function SoundManager:CreateSoundGroups()
    for _, category in pairs(SOUND_CATEGORIES) do
        local soundGroup = Instance.new("SoundGroup")
        soundGroup.Name = category
        soundGroup.Volume = volumeSettings[category] * volumeSettings.master
        soundGroup.Parent = SoundService
    end
end

function SoundManager:LoadSound(soundId, category, config)
    config = config or {}
    category = category or SOUND_CATEGORIES.SFX
    
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxassetid://" .. tostring(soundId)
    sound.Volume = config.volume or 1
    sound.Pitch = config.pitch or 1
    sound.EmitterSize = config.emitterSize or 10
    sound.RollOffMode = config.rollOffMode or Enum.RollOffMode.Inverse
    sound.Name = config.name or ("Sound_" .. soundId)
    
    -- Assign to sound group
    local soundGroup = SoundService:FindFirstChild(category)
    if soundGroup then
        sound.SoundGroup = soundGroup
    end
    
    -- Store in library if name is provided
    if config.name then
        local categoryKey = string.lower(category)
        if not soundLibrary[categoryKey] then
            soundLibrary[categoryKey] = {}
        end
        soundLibrary[categoryKey][config.name] = sound
    end
    
    return sound
end

function SoundManager:PlaySound(soundId, config)
    config = config or {}
    local category = config.category or SOUND_CATEGORIES.SFX
    
    local sound = self:GetPooledSound(soundId, category, config)
    if not sound then return nil end
    
    -- Apply config
    sound.Volume = (config.volume or 1) * self:GetCategoryVolume(category)
    sound.Pitch = config.pitch or 1
    sound.TimePosition = config.timePosition or 0
    
    -- Set 3D position if provided
    if config.position and config.parent then
        sound.Parent = config.parent
    else
        sound.Parent = SoundService
    end
    
    -- Play with fade in if specified
    if config.fadeIn then
        sound.Volume = 0
        sound:Play()
        self:FadeSound(sound, (config.volume or 1) * self:GetCategoryVolume(category), config.fadeIn)
    else
        sound:Play()
    end
    
    -- Store as active
    table.insert(activeSounds[category], sound)
    
    -- Auto-cleanup when finished
    local connection
    connection = sound.Ended:Connect(function()
        self:ReturnSoundToPool(sound, category)
        connection:Disconnect()
    end)
    
    -- Auto-stop after duration if specified
    if config.duration then
        task.spawn(function()
            wait(config.duration)
            if sound.IsPlaying then
                if config.fadeOut then
                    self:FadeSound(sound, 0, config.fadeOut, function()
                        sound:Stop()
                    end)
                else
                    sound:Stop()
                end
            end
        end)
    end
    
    return sound
end

function SoundManager:GetPooledSound(soundId, category, config)
    local pool = soundPools[category]
    local soundKey = tostring(soundId)
    
    -- Try to get from pool
    if pool[soundKey] and #pool[soundKey] > 0 then
        return table.remove(pool[soundKey])
    end
    
    -- Create new sound
    return self:LoadSound(soundId, category, config)
end

function SoundManager:ReturnSoundToPool(sound, category)
    local pool = soundPools[category]
    local soundKey = string.match(sound.SoundId, "%d+")
    
    if not soundKey then return end
    
    -- Remove from active sounds
    for i, activeSound in ipairs(activeSounds[category]) do
        if activeSound == sound then
            table.remove(activeSounds[category], i)
            break
        end
    end
    
    -- Reset sound properties
    sound:Stop()
    sound.TimePosition = 0
    sound.Parent = nil
    
    -- Add to pool
    if not pool[soundKey] then
        pool[soundKey] = {}
    end
    
    -- Limit pool size to prevent memory issues
    if #pool[soundKey] < 5 then
        table.insert(pool[soundKey], sound)
    else
        sound:Destroy()
    end
end

function SoundManager:PlayMusic(soundId, config)
    config = config or {}
    
    -- Stop current music if not crossfading
    if currentMusic and not config.crossfade then
        if config.fadeOut then
            self:FadeSound(currentMusic, 0, config.fadeOut, function()
                currentMusic:Stop()
                currentMusic = nil
            end)
        else
            currentMusic:Stop()
            currentMusic = nil
        end
    end
    
    -- Create new music
    local music = self:LoadSound(soundId, SOUND_CATEGORIES.MUSIC, {
        name = config.name,
        volume = config.volume or 1
    })
    
    music.Looped = config.looped ~= false
    music.Parent = SoundService
    
    if config.crossfade and currentMusic then
        -- Crossfade between tracks
        self:CrossfadeMusic(currentMusic, music, config.crossfade)
    else
        -- Normal fade in
        if config.fadeIn then
            music.Volume = 0
            music:Play()
            self:FadeSound(music, (config.volume or 1) * self:GetCategoryVolume(SOUND_CATEGORIES.MUSIC), config.fadeIn)
        else
            music.Volume = (config.volume or 1) * self:GetCategoryVolume(SOUND_CATEGORIES.MUSIC)
            music:Play()
        end
    end
    
    currentMusic = music
    return music
end

function SoundManager:CrossfadeMusic(oldMusic, newMusic, duration)
    duration = duration or 2
    
    local oldVolume = oldMusic.Volume
    local newVolume = (newMusic.Volume or 1) * self:GetCategoryVolume(SOUND_CATEGORIES.MUSIC)
    
    -- Start new music at 0 volume
    newMusic.Volume = 0
    newMusic:Play()
    
    -- Fade out old, fade in new
    self:FadeSound(oldMusic, 0, duration, function()
        oldMusic:Stop()
    end)
    
    self:FadeSound(newMusic, newVolume, duration)
end

function SoundManager:StopMusic(fadeOut)
    if not currentMusic then return end
    
    if fadeOut then
        self:FadeSound(currentMusic, 0, fadeOut, function()
            currentMusic:Stop()
            currentMusic = nil
        end)
    else
        currentMusic:Stop()
        currentMusic = nil
    end
end

function SoundManager:FadeSound(sound, targetVolume, duration, callback)
    if not sound or not sound.Parent then return end
    
    local tween = TweenService:Create(
        sound,
        TweenInfo.new(duration, Enum.EasingStyle.Linear),
        {Volume = targetVolume}
    )
    
    if callback then
        tween.Completed:Connect(callback)
    end
    
    tween:Play()
    return tween
end

function SoundManager:SetVolume(category, volume)
    volume = math.clamp(volume, 0, 1)
    
    if category == "master" then
        volumeSettings.master = volume
        self:UpdateAllVolumes()
    else
        volumeSettings[category] = volume
        local soundGroup = SoundService:FindFirstChild(category)
        if soundGroup then
            soundGroup.Volume = volume * volumeSettings.master
        end
    end
end

function SoundManager:GetVolume(category)
    return volumeSettings[category] or 0
end

function SoundManager:GetCategoryVolume(category)
    return (volumeSettings[category] or 1) * volumeSettings.master
end

function SoundManager:UpdateAllVolumes()
    for category, _ in pairs(SOUND_CATEGORIES) do
        local soundGroup = SoundService:FindFirstChild(category)
        if soundGroup then
            soundGroup.Volume = (volumeSettings[category] or 1) * volumeSettings.master
        end
    end
end

function SoundManager:StopAllSounds(category, fadeOut)
    category = category or nil
    
    if category then
        -- Stop sounds in specific category
        for _, sound in ipairs(activeSounds[category]) do
            if fadeOut then
                self:FadeSound(sound, 0, fadeOut, function()
                    sound:Stop()
                end)
            else
                sound:Stop()
            end
        end
        activeSounds[category] = {}
    else
        -- Stop all sounds
        for cat, sounds in pairs(activeSounds) do
            for _, sound in ipairs(sounds) do
                if fadeOut then
                    self:FadeSound(sound, 0, fadeOut, function()
                        sound:Stop()
                    end)
                else
                    sound:Stop()
                end
            end
            activeSounds[cat] = {}
        end
        
        -- Stop current music
        if currentMusic then
            if fadeOut then
                self:FadeSound(currentMusic, 0, fadeOut, function()
                    currentMusic:Stop()
                    currentMusic = nil
                end)
            else
                currentMusic:Stop()
                currentMusic = nil
            end
        end
    end
end

function SoundManager:GetSoundByName(name, category)
    if category then
        local categoryKey = string.lower(category)
        return soundLibrary[categoryKey] and soundLibrary[categoryKey][name]
    else
        -- Search all categories
        for _, sounds in pairs(soundLibrary) do
            if sounds[name] then
                return sounds[name]
            end
        end
    end
    return nil
end

function SoundManager:PlayUISound(soundName)
    local sound = self:GetSoundByName(soundName, "ui")
    if sound then
        sound:Play()
    end
end

function SoundManager:LoadDefaultSounds()
    -- Default UI sounds
    self:LoadSound(131961136, SOUND_CATEGORIES.UI, {name = "click", volume = 0.5})
    self:LoadSound(131961136, SOUND_CATEGORIES.UI, {name = "hover", volume = 0.3})
    self:LoadSound(131961136, SOUND_CATEGORIES.UI, {name = "error", volume = 0.7})
    self:LoadSound(131961136, SOUND_CATEGORIES.UI, {name = "success", volume = 0.6})
    
    -- You can add more default sounds here
end

function SoundManager:CreatePlaylist(songs, config)
    config = config or {}
    
    local playlist = {
        songs = songs,
        currentIndex = 1,
        shuffle = config.shuffle or false,
        loop = config.loop ~= false,
        crossfade = config.crossfade or 2
    }
    
    function playlist:play()
        if #self.songs > 0 then
            local song = self.songs[self.currentIndex]
            SoundManager:PlayMusic(song.id, {
                volume = song.volume,
                fadeIn = song.fadeIn,
                name = song.name
            })
            
            -- Set up next song
            if currentMusic then
                currentMusic.Ended:Connect(function()
                    self:next()
                end)
            end
        end
    end
    
    function playlist:next()
        if self.shuffle then
            self.currentIndex = math.random(1, #self.songs)
        else
            self.currentIndex = self.currentIndex + 1
            if self.currentIndex > #self.songs then
                if self.loop then
                    self.currentIndex = 1
                else
                    return
                end
            end
        end
        self:play()
    end
    
    function playlist:previous()
        self.currentIndex = self.currentIndex - 1
        if self.currentIndex < 1 then
            self.currentIndex = self.loop and #self.songs or 1
        end
        self:play()
    end
    
    return playlist
end

-- Spatial audio helpers
function SoundManager:Play3DSound(soundId, position, config)
    config = config or {}
    config.position = position
    config.parent = workspace
    
    local sound = self:PlaySound(soundId, config)
    if sound then
        -- Create attachment for 3D positioning
        local part = Instance.new("Part")
        part.Name = "SoundPart"
        part.Anchored = true
        part.CanCollide = false
        part.Transparency = 1
        part.Size = Vector3.new(1, 1, 1)
        part.Position = position
        part.Parent = workspace
        
        sound.Parent = part
        
        -- Clean up part when sound ends
        sound.Ended:Connect(function()
            part:Destroy()
        end)
    end
    
    return sound
end

return SoundManager