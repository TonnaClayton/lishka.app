import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

const ThemeShowcase: React.FC = () => {
  const colorVariables = [
    { name: "background", label: "Background" },
    { name: "foreground", label: "Foreground" },
    { name: "card", label: "Card" },
    { name: "card-foreground", label: "Card Foreground" },
    { name: "popover", label: "Popover" },
    { name: "popover-foreground", label: "Popover Foreground" },
    { name: "primary", label: "Primary" },
    { name: "primary-foreground", label: "Primary Foreground" },
    { name: "secondary", label: "Secondary" },
    { name: "secondary-foreground", label: "Secondary Foreground" },
    { name: "muted", label: "Muted" },
    { name: "muted-foreground", label: "Muted Foreground" },
    { name: "accent", label: "Accent" },
    { name: "accent-foreground", label: "Accent Foreground" },
    { name: "destructive", label: "Destructive" },
    { name: "destructive-foreground", label: "Destructive Foreground" },
    { name: "border", label: "Border" },
    { name: "input", label: "Input" },
    { name: "ring", label: "Ring" },
  ];

  const nightModeColors = [
    { name: "background", value: "#000000", label: "Background" },
    { name: "foreground", value: "#0251FB", label: "Foreground" },
    { name: "muted", value: "#1a1a1a", label: "Muted" },
    { name: "border", value: "#333333", label: "Border" },
  ];

  const textColorVariables = [
    { name: "foreground", label: "Default Text" },
    { name: "muted-foreground", label: "Muted Text" },
    { name: "primary-foreground", label: "Primary Text" },
    { name: "secondary-foreground", label: "Secondary Text" },
    { name: "accent-foreground", label: "Accent Text" },
    { name: "destructive-foreground", label: "Destructive Text" },
    { name: "card-foreground", label: "Card Text" },
    { name: "popover-foreground", label: "Popover Text" },
  ];

  return (
    <div className="p-6 bg-white">
      <h1 className="text-2xl font-bold mb-6">Theme Color Showcase</h1>
      <div className="grid grid-cols-2 gap-6">
        {/* Day Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Day Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {colorVariables.map((variable) => (
                <div key={variable.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {variable.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      var(--{variable.name})
                    </span>
                  </div>
                  <div
                    className="h-10 rounded-md border"
                    style={{ backgroundColor: `hsl(var(--${variable.name}))` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Night Mode */}
        <Card className="night-mode">
          <CardHeader>
            <CardTitle>Night Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {colorVariables.map((variable) => {
                // Find if this variable has a night mode override
                const nightModeOverride = nightModeColors.find(
                  (c) => c.name === variable.name,
                );

                return (
                  <div key={variable.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {variable.label}
                      </span>
                      {nightModeOverride && (
                        <span className="text-xs text-muted-foreground">
                          {nightModeOverride.value}
                        </span>
                      )}
                    </div>
                    <div
                      className="h-10 rounded-md border"
                      style={{
                        backgroundColor: nightModeOverride
                          ? nightModeOverride.value
                          : `hsl(var(--${variable.name}))`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <Separator className="my-8" />
      <h2 className="text-xl font-bold mb-4">Text Colors</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Day Mode Text Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Day Mode Text Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {textColorVariables.map((variable) => (
                <div key={variable.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {variable.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      var(--{variable.name})
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-md border"
                    style={{ backgroundColor: "white" }}
                  >
                    <p style={{ color: `hsl(var(--${variable.name}))` }}>
                      This text uses {variable.label} color
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Night Mode Text Colors */}
        <Card className="night-mode">
          <CardHeader>
            <CardTitle>Night Mode Text Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {textColorVariables.map((variable) => (
                <div key={variable.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {variable.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      var(--{variable.name})
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-md border"
                    style={{ backgroundColor: "#1a1a1a" }}
                  >
                    <p style={{ color: `hsl(var(--${variable.name}))` }}>
                      This text uses {variable.label} color
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Separator className="my-8" />
      <h2 className="text-xl font-bold mb-4">Night Mode Specific Colors</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            {nightModeColors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{color.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {color.value}
                  </span>
                </div>
                <div
                  className="h-16 rounded-md"
                  style={{ backgroundColor: color.value }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Separator className="my-8" />
      <h2 className="text-xl font-bold mb-4">UI Component Examples</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Day Mode Components */}
        <Card>
          <CardHeader>
            <CardTitle>Day Mode Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                Primary Button
              </button>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md">
                Secondary Button
              </button>
              <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md">
                Destructive Button
              </button>
              <div className="bg-muted text-primary-foreground p-4 rounded-md">
                Muted Container
              </div>
              <div className="bg-accent text-accent-foreground p-4 rounded-md">
                Accent Container
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Night Mode Components */}
        <Card className="night-mode">
          <CardHeader>
            <CardTitle>Night Mode Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                Primary Button
              </button>
              <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md">
                Secondary Button
              </button>
              <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md">
                Destructive Button
              </button>
              <div className="bg-muted p-4 rounded-md text-primary-foreground">
                Muted Container
              </div>
              <div className="bg-accent text-accent-foreground p-4 rounded-md">
                Accent Container
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Separator className="my-8" />
      <h2 className="text-xl font-bold mb-4">Typography Examples</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Day Mode Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Day Mode Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Heading 1</h1>
              <h2 className="text-3xl font-bold">Heading 2</h2>
              <h3 className="text-2xl font-bold">Heading 3</h3>
              <h4 className="text-xl font-bold">Heading 4</h4>
              <p className="text-base">Regular paragraph text</p>
              <p className="text-sm">Small text</p>
              <p className="text-xs">Extra small text</p>
              <p className="text-muted-foreground">Muted text</p>
              <p>
                <a href="#" className="text-primary underline">
                  Primary link
                </a>
              </p>
              <p>
                <a href="#" className="text-secondary underline">
                  Secondary link
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Night Mode Typography */}
        <Card className="night-mode">
          <CardHeader>
            <CardTitle>Night Mode Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Heading 1</h1>
              <h2 className="text-3xl font-bold">Heading 2</h2>
              <h3 className="text-2xl font-bold">Heading 3</h3>
              <h4 className="text-xl font-bold">Heading 4</h4>
              <p className="text-base">Regular paragraph text</p>
              <p className="text-sm">Small text</p>
              <p className="text-xs">Extra small text</p>
              <p className="text-muted-foreground">Muted text</p>
              <p>
                <a href="#" className="text-primary underline">
                  Primary link
                </a>
              </p>
              <p>
                <a href="#" className="text-secondary underline">
                  Secondary link
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeShowcase;
