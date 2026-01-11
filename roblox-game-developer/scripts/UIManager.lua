-- UIManager.lua - Comprehensive UI management system
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")
local Players = game:GetService("Players")

local UIManager = {}
UIManager.__index = UIManager

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Animation presets
local ANIMATION_PRESETS = {
    fadeIn = {
        duration = 0.3,
        properties = {BackgroundTransparency = 0, TextTransparency = 0},
        easingStyle = Enum.EasingStyle.Quad,
        easingDirection = Enum.EasingDirection.Out
    },
    fadeOut = {
        duration = 0.3,
        properties = {BackgroundTransparency = 1, TextTransparency = 1},
        easingStyle = Enum.EasingStyle.Quad,
        easingDirection = Enum.EasingDirection.Out
    },
    slideUp = {
        duration = 0.4,
        properties = {Position = UDim2.fromScale(0.5, 0.5)},
        easingStyle = Enum.EasingStyle.Back,
        easingDirection = Enum.EasingDirection.Out,
        startPosition = UDim2.fromScale(0.5, 1.2)
    },
    slideDown = {
        duration = 0.4,
        properties = {Position = UDim2.fromScale(0.5, 1.2)},
        easingStyle = Enum.EasingStyle.Back,
        easingDirection = Enum.EasingDirection.In
    },
    scaleIn = {
        duration = 0.3,
        properties = {Size = UDim2.fromScale(1, 1)},
        easingStyle = Enum.EasingStyle.Back,
        easingDirection = Enum.EasingDirection.Out,
        startSize = UDim2.fromScale(0, 0)
    },
    scaleOut = {
        duration = 0.2,
        properties = {Size = UDim2.fromScale(0, 0)},
        easingStyle = Enum.EasingStyle.Back,
        easingDirection = Enum.EasingDirection.In
    }
}

-- Color themes
local THEMES = {
    dark = {
        background = Color3.fromRGB(25, 25, 25),
        surface = Color3.fromRGB(35, 35, 35),
        primary = Color3.fromRGB(100, 150, 255),
        secondary = Color3.fromRGB(150, 100, 255),
        text = Color3.fromRGB(255, 255, 255),
        textSecondary = Color3.fromRGB(200, 200, 200),
        accent = Color3.fromRGB(255, 100, 100)
    },
    light = {
        background = Color3.fromRGB(245, 245, 245),
        surface = Color3.fromRGB(255, 255, 255),
        primary = Color3.fromRGB(25, 100, 255),
        secondary = Color3.fromRGB(100, 25, 255),
        text = Color3.fromRGB(25, 25, 25),
        textSecondary = Color3.fromRGB(75, 75, 75),
        accent = Color3.fromRGB(255, 50, 50)
    }
}

local currentTheme = "dark"
local activeScreens = {}
local notifications = {}

function UIManager:SetTheme(themeName)
    if THEMES[themeName] then
        currentTheme = themeName
        self:RefreshAllScreens()
    end
end

function UIManager:GetTheme()
    return THEMES[currentTheme]
end

function UIManager:CreateScreen(name, config)
    config = config or {}
    
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = name
    screenGui.ResetOnSpawn = config.resetOnSpawn ~= false
    screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    screenGui.Parent = playerGui
    
    -- Main frame
    local frame = Instance.new("Frame")
    frame.Name = "Main"
    frame.Size = config.size or UDim2.fromScale(1, 1)
    frame.Position = config.position or UDim2.fromScale(0, 0)
    frame.BackgroundColor3 = config.backgroundColor or self:GetTheme().background
    frame.BackgroundTransparency = config.transparency or 0
    frame.BorderSizePixel = 0
    frame.Parent = screenGui
    
    -- Add corner radius if specified
    if config.cornerRadius then
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, config.cornerRadius)
        corner.Parent = frame
    end
    
    activeScreens[name] = {
        screenGui = screenGui,
        frame = frame,
        config = config
    }
    
    return screenGui, frame
end

function UIManager:ShowScreen(name, animation)
    local screen = activeScreens[name]
    if not screen then return end
    
    screen.screenGui.Enabled = true
    
    if animation then
        self:AnimateElement(screen.frame, animation)
    end
end

function UIManager:HideScreen(name, animation, callback)
    local screen = activeScreens[name]
    if not screen then return end
    
    if animation then
        self:AnimateElement(screen.frame, animation, function()
            screen.screenGui.Enabled = false
            if callback then callback() end
        end)
    else
        screen.screenGui.Enabled = false
        if callback then callback() end
    end
end

function UIManager:CreateButton(parent, config)
    config = config or {}
    
    local button = Instance.new("TextButton")
    button.Name = config.name or "Button"
    button.Size = config.size or UDim2.fromOffset(200, 50)
    button.Position = config.position or UDim2.fromScale(0.5, 0.5)
    button.AnchorPoint = config.anchorPoint or Vector2.new(0.5, 0.5)
    button.BackgroundColor3 = config.color or self:GetTheme().primary
    button.BorderSizePixel = 0
    button.Text = config.text or "Button"
    button.TextColor3 = config.textColor or Color3.white
    button.TextSize = config.textSize or 18
    button.Font = config.font or Enum.Font.SourceSansBold
    button.Parent = parent
    
    -- Add corner radius
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, config.cornerRadius or 8)
    corner.Parent = button
    
    -- Hover effects
    button.MouseEnter:Connect(function()
        self:AnimateElement(button, {
            duration = 0.1,
            properties = {Size = (config.size or UDim2.fromOffset(200, 50)) + UDim2.fromOffset(5, 2)},
            easingStyle = Enum.EasingStyle.Quad,
            easingDirection = Enum.EasingDirection.Out
        })
    end)
    
    button.MouseLeave:Connect(function()
        self:AnimateElement(button, {
            duration = 0.1,
            properties = {Size = config.size or UDim2.fromOffset(200, 50)},
            easingStyle = Enum.EasingStyle.Quad,
            easingDirection = Enum.EasingDirection.Out
        })
    end)
    
    -- Click callback
    if config.onClick then
        button.MouseButton1Click:Connect(config.onClick)
    end
    
    return button
end

function UIManager:CreateLabel(parent, config)
    config = config or {}
    
    local label = Instance.new("TextLabel")
    label.Name = config.name or "Label"
    label.Size = config.size or UDim2.fromOffset(200, 30)
    label.Position = config.position or UDim2.fromScale(0.5, 0.5)
    label.AnchorPoint = config.anchorPoint or Vector2.new(0.5, 0.5)
    label.BackgroundTransparency = config.transparency or 1
    label.Text = config.text or "Label"
    label.TextColor3 = config.textColor or self:GetTheme().text
    label.TextSize = config.textSize or 16
    label.Font = config.font or Enum.Font.SourceSans
    label.TextXAlignment = config.textXAlignment or Enum.TextXAlignment.Center
    label.TextYAlignment = config.textYAlignment or Enum.TextYAlignment.Center
    label.Parent = parent
    
    return label
end

function UIManager:CreateProgressBar(parent, config)
    config = config or {}
    
    local frame = Instance.new("Frame")
    frame.Name = config.name or "ProgressBar"
    frame.Size = config.size or UDim2.fromOffset(300, 20)
    frame.Position = config.position or UDim2.fromScale(0.5, 0.5)
    frame.AnchorPoint = config.anchorPoint or Vector2.new(0.5, 0.5)
    frame.BackgroundColor3 = config.backgroundColor or self:GetTheme().surface
    frame.BorderSizePixel = 0
    frame.Parent = parent
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, config.cornerRadius or 10)
    corner.Parent = frame
    
    local fill = Instance.new("Frame")
    fill.Name = "Fill"
    fill.Size = UDim2.fromScale(0, 1)
    fill.Position = UDim2.fromScale(0, 0)
    fill.BackgroundColor3 = config.fillColor or self:GetTheme().primary
    fill.BorderSizePixel = 0
    fill.Parent = frame
    
    local fillCorner = Instance.new("UICorner")
    fillCorner.CornerRadius = UDim.new(0, config.cornerRadius or 10)
    fillCorner.Parent = fill
    
    -- Progress update function
    local progressBar = {
        frame = frame,
        fill = fill,
        setValue = function(value)
            value = math.clamp(value, 0, 1)
            TweenService:Create(fill, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
                Size = UDim2.fromScale(value, 1)
            }):Play()
        end
    }
    
    return progressBar
end

function UIManager:ShowNotification(text, duration, notificationType)
    duration = duration or 3
    notificationType = notificationType or "info"
    
    local notification = Instance.new("Frame")
    notification.Size = UDim2.fromOffset(400, 80)
    notification.Position = UDim2.new(1, -20, 0, 20 + (#notifications * 90))
    notification.AnchorPoint = Vector2.new(1, 0)
    notification.BackgroundColor3 = self:GetTheme().surface
    notification.BorderSizePixel = 0
    notification.Parent = playerGui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = notification
    
    local label = Instance.new("TextLabel")
    label.Size = UDim2.fromScale(1, 1)
    label.Position = UDim2.fromScale(0, 0)
    label.BackgroundTransparency = 1
    label.Text = text
    label.TextColor3 = self:GetTheme().text
    label.TextSize = 16
    label.Font = Enum.Font.SourceSans
    label.TextWrapped = true
    label.Parent = notification
    
    table.insert(notifications, notification)
    
    -- Slide in animation
    self:AnimateElement(notification, "slideIn", function()
        wait(duration)
        -- Slide out animation
        self:AnimateElement(notification, "slideOut", function()
            notification:Destroy()
            -- Remove from notifications list
            for i, notif in ipairs(notifications) do
                if notif == notification then
                    table.remove(notifications, i)
                    break
                end
            end
            -- Reposition remaining notifications
            self:RepositionNotifications()
        end)
    end)
end

function UIManager:RepositionNotifications()
    for i, notification in ipairs(notifications) do
        TweenService:Create(notification, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
            Position = UDim2.new(1, -20, 0, 20 + ((i-1) * 90))
        }):Play()
    end
end

function UIManager:AnimateElement(element, animation, callback)
    if type(animation) == "string" then
        animation = ANIMATION_PRESETS[animation]
    end
    
    if not animation then return end
    
    -- Set starting properties if specified
    if animation.startPosition then
        element.Position = animation.startPosition
    end
    if animation.startSize then
        element.Size = animation.startSize
    end
    
    local tween = TweenService:Create(
        element,
        TweenInfo.new(
            animation.duration,
            animation.easingStyle,
            animation.easingDirection
        ),
        animation.properties
    )
    
    if callback then
        tween.Completed:Connect(callback)
    end
    
    tween:Play()
    return tween
end

function UIManager:CreateModal(title, content, buttons)
    local modal = self:CreateScreen("Modal", {
        backgroundColor = Color3.fromRGB(0, 0, 0),
        transparency = 0.5,
        resetOnSpawn = false
    })
    
    local dialog = Instance.new("Frame")
    dialog.Name = "Dialog"
    dialog.Size = UDim2.fromOffset(400, 300)
    dialog.Position = UDim2.fromScale(0.5, 0.5)
    dialog.AnchorPoint = Vector2.new(0.5, 0.5)
    dialog.BackgroundColor3 = self:GetTheme().surface
    dialog.BorderSizePixel = 0
    dialog.Parent = modal[2]
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 12)
    corner.Parent = dialog
    
    -- Title
    local titleLabel = self:CreateLabel(dialog, {
        name = "Title",
        text = title,
        size = UDim2.new(1, -40, 0, 40),
        position = UDim2.fromOffset(20, 20),
        anchorPoint = Vector2.new(0, 0),
        textSize = 20,
        font = Enum.Font.SourceSansBold
    })
    
    -- Content
    local contentLabel = self:CreateLabel(dialog, {
        name = "Content",
        text = content,
        size = UDim2.new(1, -40, 1, -120),
        position = UDim2.fromOffset(20, 60),
        anchorPoint = Vector2.new(0, 0),
        textSize = 16
    })
    
    -- Buttons
    local buttonFrame = Instance.new("Frame")
    buttonFrame.Name = "Buttons"
    buttonFrame.Size = UDim2.new(1, -40, 0, 40)
    buttonFrame.Position = UDim2.new(0, 20, 1, -60)
    buttonFrame.BackgroundTransparency = 1
    buttonFrame.Parent = dialog
    
    local buttonLayout = Instance.new("UIListLayout")
    buttonLayout.FillDirection = Enum.FillDirection.Horizontal
    buttonLayout.HorizontalAlignment = Enum.HorizontalAlignment.Right
    buttonLayout.Padding = UDim.new(0, 10)
    buttonLayout.Parent = buttonFrame
    
    for _, buttonConfig in ipairs(buttons or {}) do
        local button = self:CreateButton(buttonFrame, {
            text = buttonConfig.text,
            size = UDim2.fromOffset(100, 40),
            onClick = function()
                if buttonConfig.onClick then
                    buttonConfig.onClick()
                end
                self:HideScreen("Modal", "fadeOut", function()
                    modal[1]:Destroy()
                end)
            end
        })
    end
    
    self:ShowScreen("Modal", "fadeIn")
    return modal
end

function UIManager:RefreshAllScreens()
    -- Refresh theme for all active screens
    for name, screen in pairs(activeScreens) do
        if screen.config.backgroundColor then
            screen.frame.BackgroundColor3 = self:GetTheme().background
        end
    end
end

return UIManager