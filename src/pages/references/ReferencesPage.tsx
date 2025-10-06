import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Type, 
  Square, 
  MousePointer, 
  Layout, 
  Code, 
  Copy, 
  Check,
  BookOpen
} from 'lucide-react';
import { Button, Input, Card } from '../../components/Shared/SharedComponents';

export type ReferenceTab = 'colors' | 'typography' | 'buttons' | 'inputs' | 'layout' | 'code';

interface ReferenceTabConfig {
  id: ReferenceTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
}

const ColorPalette: React.FC = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colors = [
    { name: 'TG Primary', value: '#acdfeb', css: 'bg-tg-primary', description: 'Primary brand color for main actions' },
    { name: 'TG Coral', value: '#f4c7c3', css: 'bg-tg-coral', description: 'Accent color for highlights' },
    { name: 'TG Green', value: '#b7e1cd', css: 'bg-tg-green', description: 'Success states and positive actions' },
  ];

  const copyColor = async (color: string) => {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Brand Colors</h3>
        <p className="text-gray-600 mb-4">Consistent color palette for the TriggerGrain ecosystem</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {colors.map((color) => (
            <Card key={color.name} className="p-4">
              <div className="flex items-center gap-4">
                <div 
                  className={`w-12 h-12 rounded-lg ${color.css} shadow-md`}
                />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800">{color.name}</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{color.value}</code>
                    <button
                      onClick={() => copyColor(color.value)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {copiedColor === color.value ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Usage Examples</h3>
        <Card className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">
{`// CSS Custom Properties
:root {
  --tg-primary: #acdfeb;
  --tg-coral: #f4c7c3;
  --tg-green: #b7e1cd;
}

// Tailwind Classes
<div className="bg-tg-primary text-white">Primary Button</div>
<div className="bg-tg-green text-white">Success State</div>
<div className="bg-tg-coral text-white">Accent Element</div>`}
          </pre>
        </Card>
      </div>
    </div>
  );
};

const Typography: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Font Family</h3>
        <Card className="p-4">
          <p className="text-base text-gray-600 mb-2">Primary font: <strong className="text-gray-800">Raleway</strong></p>
          <p className="text-gray-500">Available weights: 300, 400, 500, 600, 700</p>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Typography Scale</h3>
        <div className="space-y-4">
          <Card className="p-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Heading 1</h1>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">text-3xl font-bold</code>
          </Card>
          
          <Card className="p-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Heading 2</h2>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">text-2xl font-semibold</code>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Heading 3</h3>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">text-xl font-semibold</code>
          </Card>
          
          <Card className="p-4">
            <p className="text-base text-gray-700 mb-2">Body Text - Regular paragraph text</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">text-base text-gray-700</code>
          </Card>
          
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-2">Small Text - For captions</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">text-sm text-gray-600</code>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ButtonExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Button Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Primary & Secondary</h4>
            <div className="space-y-3">
              <Button variant="primary" size="md">Medium Primary</Button>
              <Button variant="secondary" size="md">Medium Secondary</Button>
            </div>
          </Card>
          
          <Card className="p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Outline & States</h4>
            <div className="space-y-3">
              <Button variant="outline" size="md">Medium Outline</Button>
              <Button variant="primary" size="md" loading>Loading State</Button>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Usage Code</h3>
        <Card className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">
{`import { Button } from '../../components/Shared/SharedComponents';

// Basic usage
<Button variant="primary" size="md">Click Me</Button>

// With loading state
<Button variant="primary" loading>Processing...</Button>`}
          </pre>
        </Card>
      </div>
    </div>
  );
};

const InputExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Input Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Basic Inputs</h4>
            <div className="space-y-4">
              <Input 
                variant="default" 
                size="md" 
                placeholder="Medium input" 
              />
              <Input 
                variant="filled" 
                size="md" 
                placeholder="Medium filled" 
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-3">With Labels & States</h4>
            <div className="space-y-4">
              <Input 
                label="Email Address" 
                placeholder="Enter your email" 
                type="email"
              />
              <Input 
                label="Error State" 
                placeholder="Invalid input" 
                error="This field is required"
              />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Usage Code</h3>
        <Card className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">
{`import { Input } from '../../components/Shared/SharedComponents';

// Basic usage
<Input placeholder="Enter text" />

// With label and helper text
<Input 
  label="Email Address"
  placeholder="Enter your email"
/>

// Error state
<Input 
  label="Required Field"
  error="This field is required"
/>`}
          </pre>
        </Card>
      </div>
    </div>
  );
};

const LayoutExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Card Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" className="text-center p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-2">Default Card</h4>
            <p className="text-sm text-gray-600">Standard shadow and border</p>
          </Card>
          
          <Card variant="elevated" className="text-center p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-2">Elevated Card</h4>
            <p className="text-sm text-gray-600">Larger shadow for emphasis</p>
          </Card>
          
          <Card variant="outlined" className="text-center p-4">
            <h4 className="text-base font-semibold text-gray-800 mb-2">Outlined Card</h4>
            <p className="text-sm text-gray-600">Border only, no shadow</p>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Spacing System</h3>
        <Card className="p-4">
          <p className="text-gray-600 mb-4">TriggerGrain uses an 8px spacing system:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-4 h-6 bg-tg-primary rounded"></div>
              <code className="font-mono text-xs">p-2</code> = 8px
            </div>
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-tg-primary rounded"></div>
              <code className="font-mono text-xs">p-3</code> = 12px
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-6 bg-tg-primary rounded"></div>
              <code className="font-mono text-xs">p-4</code> = 16px
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Border Radius</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3 text-center rounded-lg">
            <div className="w-12 h-12 bg-tg-primary rounded-lg mx-auto mb-2"></div>
            <code className="text-xs font-mono">rounded-lg</code>
            <p className="text-xs text-gray-500 mt-1">8px - Buttons</p>
          </Card>
          <Card className="p-3 text-center rounded-xl">
            <div className="w-12 h-12 bg-tg-green rounded-xl mx-auto mb-2"></div>
            <code className="text-xs font-mono">rounded-xl</code>
            <p className="text-xs text-gray-500 mt-1">12px - Cards</p>
          </Card>
          <Card className="p-3 text-center rounded-2xl">
            <div className="w-12 h-12 bg-tg-coral rounded-2xl mx-auto mb-2"></div>
            <code className="text-xs font-mono">rounded-2xl</code>
            <p className="text-xs text-gray-500 mt-1">16px - Modals</p>
          </Card>
          <Card className="p-3 text-center rounded-3xl">
            <div className="w-12 h-12 bg-tg-primary rounded-3xl mx-auto mb-2"></div>
            <code className="text-xs font-mono">rounded-2xl</code>
            <p className="text-xs text-gray-500 mt-1">16px - Special</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CodeExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Component Structure</h3>
        <Card className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">
{`// Standard component structure
import React from 'react';
import { motion } from 'framer-motion';
import { Card, Button } from '../../components/Shared/SharedComponents';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onAction 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {title}
        </h2>
        <Button variant="primary" onClick={onAction}>
          Take Action
        </Button>
      </Card>
    </motion.div>
  );
};`}
          </pre>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Animation Patterns</h3>
        <Card className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">
{`// Standard fade-in animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content here
</motion.div>

// Hover animations
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}>
  Interactive Element
</motion.button>`}
          </pre>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">File Organization</h3>
        <Card className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto font-mono">
{`src/pages/myFeature/
├── MyFeaturePage.tsx          # Main page component
├── components/                # Feature-specific components
│   ├── FeatureCard.tsx
│   ├── FeatureList.tsx
│   └── FeatureForm.tsx
├── hooks/                     # Feature-specific hooks
│   ├── useFeatureData.ts
│   └── useFeatureValidation.ts
├── types/                     # Feature-specific types
│   └── featureTypes.ts
└── index.ts                   # Clean exports

// Clean exports in index.ts
export { MyFeaturePage } from './MyFeaturePage';
export { FeatureCard, FeatureList } from './components';
export type { Feature, FeatureFormData } from './types/featureTypes';`}
          </pre>
        </Card>
      </div>
    </div>
  );
};

const referenceTabs: ReferenceTabConfig[] = [
  {
    id: 'colors',
    title: 'Colors',
    icon: Palette,
    description: 'Brand colors and usage guidelines',
    component: ColorPalette
  },
  {
    id: 'typography',
    title: 'Typography',
    icon: Type,
    description: 'Font scales, weights, and text styling',
    component: Typography
  },
  {
    id: 'buttons',
    title: 'Buttons',
    icon: MousePointer,
    description: 'Button variants, sizes, and states',
    component: ButtonExamples
  },
  {
    id: 'inputs',
    title: 'Inputs',
    icon: Square,
    description: 'Input fields and form elements',
    component: InputExamples
  },
  {
    id: 'layout',
    title: 'Layout',
    icon: Layout,
    description: 'Cards, spacing, and layout patterns',
    component: LayoutExamples
  },
  {
    id: 'code',
    title: 'Code Patterns',
    icon: Code,
    description: 'Component structure and best practices',
    component: CodeExamples
  }
];

export const ReferencesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReferenceTab>('colors');

  const activeTabConfig = referenceTabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component || (() => null);

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-tg-coral rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Design References</h1>
              <p className="text-sm text-gray-500">Standardized components and patterns for consistency</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {referenceTabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-tg-coral shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.title}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <ActiveComponent />
        </motion.div>
      </div>
    </div>
  );
};