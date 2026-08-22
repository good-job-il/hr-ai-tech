export default function UIShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-12" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Header */}
        <div className="text-center">
          <H1>UI Kit & Design System</H1>

          <Body1 className="mt-4 text-gray-600 max-w-2xl mx-auto">
            בעיצוב מלא, עם כל הקומפוננטות, States, וSizeים שלך צריך כדי לבנות את האפליקציה בעיצוב
            Premium עקבי.
          </Body1>
        </div>

        {/* Buttons */}
        <section className="space-y-8">
          <H2>Buttons</H2>

          {/* Primary Buttons */}
          <div className="space-y-4">
            <H4>Primary Variant</H4>

            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small Button</Button>

              <Button size="md">Medium Button</Button>

              <Button size="lg">Large Button</Button>

              <Button size="xl">Extra Large Button</Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="md" disabled>
                Disabled Button
              </Button>

              <Button size="md" className="w-full">
                Full Width
              </Button>
            </div>
          </div>

          {/* Secondary Buttons */}
          <div className="space-y-4">
            <H4>Secondary Variant</H4>

            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="sm">
                Small Button
              </Button>

              <Button variant="secondary" size="md">
                Medium Button
              </Button>

              <Button variant="secondary" size="lg">
                Large Button
              </Button>
            </div>
          </div>

          {/* Other Variants */}
          <div className="space-y-4">
            <H4>Other Variants</H4>

            <div className="flex flex-wrap gap-4">
              <Button variant="outline" size="md">
                Outline
              </Button>

              <Button variant="ghost" size="md">
                Ghost
              </Button>

              <Button variant="error" size="md">
                Error
              </Button>

              <Button variant="success" size="md">
                Success
              </Button>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-8">
          <H2>Cards</H2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant="elevated">
              <H4 className="mb-3">Elevated Card</H4>

              <Body2>
                זה הוא כרטיס עם background לבן חצי שקוף, גבול כחול עדין, shadow מעולה, וblur
                backdrop.
              </Body2>
            </Card>

            <Card variant="glass">
              <H4 className="mb-3">Glass Card</H4>

              <Body2>
                כרטיס Glass עם gradient רך, שקיפות גבוהה, ו־Blur backdrop לעומק ויזואלי מקסימלי.
              </Body2>
            </Card>

            <Card variant="minimal">
              <H4 className="mb-3">Minimal Card</H4>

              <Body2>
                כרטיס מינימלי עם shadow דק וגבול עדין. מתאים ללפטים ודברים פחות חשמלניים.
              </Body2>
            </Card>

            <Card variant="dark">
              <H4 className="mb-3 text-white">Dark Card</H4>

              <Body2 className="text-gray-300">
                כרטיס אפור עם גבול כהה וshadow כבד. למצבים בהם צריך קונטרסט חזק.
              </Body2>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-8">
          <H2>Inputs</H2>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Default Input</Label>

              <Input placeholder="הקלד כאן..." />
            </div>

            <div className="space-y-2">
              <Label>Filled Input</Label>

              <Input variant="filled" placeholder="הקלד כאן..." />
            </div>

            <div className="space-y-2">
              <Label>Flush Input (Border Bottom)</Label>

              <Input variant="flush" placeholder="הקלד כאן..." />
            </div>

            <div className="space-y-2">
              <Label>Input with Error State</Label>

              <Input className="border-red-500 focus:ring-red-300/50" placeholder="שגיאה" />
            </div>

            <div className="space-y-2">
              <Label>Disabled Input</Label>

              <Input disabled placeholder="אי אפשר להקליד..." />
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-8">
          <H2>Badges</H2>

          <div className="space-y-6">
            <H4>Color Variants</H4>

            <div className="flex flex-wrap gap-3">
              <Badge variant="primary">Primary</Badge>

              <Badge variant="secondary">Secondary</Badge>

              <Badge variant="success">Success</Badge>

              <Badge variant="warning">Warning</Badge>

              <Badge variant="error">Error</Badge>

              <Badge variant="neutral">Neutral</Badge>

              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <H4>Skill Tags</H4>

            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">React</Badge>

              <Badge variant="secondary">TypeScript</Badge>

              <Badge variant="success">Node.js</Badge>

              <Badge variant="warning">MongoDB</Badge>

              <Badge variant="error">AWS</Badge>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-8">
          <H2>Typography</H2>

          <div className="space-y-6">
            <div>
              <Caption className="mb-2">H1 - 8xl, Black</Caption>

              <H1>Large Headline Here</H1>
            </div>

            <div>
              <Caption className="mb-2">H2 - 7xl, Black</Caption>

              <H2>Smaller Headline</H2>
            </div>

            <div>
              <Caption className="mb-2">H3 - 3xl, Black</Caption>

              <H3>Section Heading</H3>
            </div>

            <div>
              <Caption className="mb-2">H4 - 2xl, Bold</Caption>

              <H4>Subsection Heading</H4>
            </div>

            <div>
              <Caption className="mb-2">Body1 - Base, Regular</Caption>

              <Body1>
                זה הטקסט הראשי של הגוף. הוא אמור להיות קראה וברור. זה השטח שבו רוב ה־content נמצא
                ו־100 מילה לפחות הן רעיון טוב כדי לראות איך הטקסט נראה בפסקה ממשית.
              </Body1>
            </div>

            <div>
              <Caption className="mb-2">Body2 - Small, Regular</Caption>

              <Body2>זה טקסט משנה עבור פרטים פחות חשובים או הערות. הוא קטן ועדין יותר.</Body2>
            </div>

            <div>
              <Caption>Caption - Tiny, Regular</Caption>
            </div>
          </div>
        </section>

        {/* Colors */}
        <section className="space-y-8">
          <H2>Color Palette</H2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Purple 600", color: "#8B5CF6" },
              { name: "Blue 600", color: "#3B82F6" },
              { name: "Cyan 500", color: "#06B6D4" },
              { name: "Green 600", color: "#10B981" },
              { name: "Yellow 500", color: "#F59E0B" },
              { name: "Red 500", color: "#EF4444" },
              { name: "Gray 900", color: "#111827" },
              { name: "Gray 700", color: "#374151" },
              { name: "Gray 500", color: "#6B7280" },
              { name: "Gray 300", color: "#D1D5DB" },
              { name: "Gray 100", color: "#F3F4F6" },
              { name: "White", color: "#FFFFFF" },
            ].map((item) => (
              <div key={item.name} className="space-y-2">
                <div
                  className="w-full aspect-square rounded-lg border border-gray-200"
                  style={{ backgroundColor: item.color }}
                />

                <Body2 className="text-center font-mono">{item.color}</Body2>

                <Caption className="text-center">{item.name}</Caption>
              </div>
            ))}
          </div>
        </section>

        {/* Component Combinations */}
        <section className="space-y-8">
          <H2>Component Combinations</H2>

          <Card variant="elevated">
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Name</Label>

                <Input placeholder="שם מלא" />
              </div>

              <div>
                <Label className="mb-3 block">Email</Label>

                <Input type="email" placeholder="email@example.com" />
              </div>

              <div>
                <Label className="mb-2 block">Skills</Label>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="primary">React</Badge>

                  <Badge variant="secondary">TypeScript</Badge>

                  <Badge variant="success">Node.js</Badge>
                </div>

                <Input placeholder="הוסף כישור..." />
              </div>

              <div className="flex gap-3 pt-6">
                <Button variant="secondary" className="flex-1">
                  Cancel
                </Button>

                <Button className="flex-1">Save</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center pt-12 border-t border-gray-200">
          <Body2 className="text-gray-500">Design System v1.0 | HeadHunter HR-Tech</Body2>
        </div>
      </div>
    </div>
  )
}
import Button from "@/components/design/Button"
import Card from "@/components/design/Card"
import Input from "@/components/design/Input"
import Badge from "@/components/design/Badge"
import { H1, H2, H3, H4, Body1, Body2, Caption, Label } from "@/components/design/Typography"
