# UI Components Library

A collection of reusable, industry-grade UI components built with React and Tailwind CSS.

## Components

### Button
A versatile button component with multiple variants, sizes, and states.

```jsx
import { Button } from './UI';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger">Danger</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button loading>Loading...</Button>

// With icons
<Button icon={Plus} iconPosition="left">Add Item</Button>

// Full width
<Button fullWidth>Full Width</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean
- `icon`: React component
- `iconPosition`: 'left' | 'right'

### Card
A flexible card component with header, content, and footer sections.

```jsx
import { Card } from './UI';

// Basic card
<Card>
  <p>Card content</p>
</Card>

// Card with all sections
<Card>
  <Card.Header>
    <Card.Title>Card Title</Card.Title>
    <Card.Description>Card description</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Main content goes here</p>
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>

// Card with different padding and shadow
<Card padding="lg" shadow="xl" hover>
  <p>Hoverable card</p>
</Card>
```

**Props:**
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `shadow`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `rounded`: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `hover`: boolean

### Input
A comprehensive input component with validation, icons, and password toggle.

```jsx
import { Input } from './UI';
import { Mail, Lock } from 'lucide-react';

// Basic input
<Input
  label="Email"
  name="email"
  type="email"
  value={value}
  onChange={handleChange}
/>

// Input with icon
<Input
  label="Email"
  name="email"
  type="email"
  leftIcon={<Mail className="h-4 w-4" />}
  value={value}
  onChange={handleChange}
/>

// Password input with toggle
<Input
  label="Password"
  name="password"
  type="password"
  showPasswordToggle
  leftIcon={<Lock className="h-4 w-4" />}
  value={value}
  onChange={handleChange}
/>

// Input with error
<Input
  label="Username"
  name="username"
  error="Username is required"
  helperText="Choose a unique username"
  value={value}
  onChange={handleChange}
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `showPasswordToggle`: boolean
- `leftIcon`: React component
- `rightIcon`: React component
- `required`: boolean
- `disabled`: boolean

### LoadingSpinner
A loading spinner component with different sizes and colors.

```jsx
import { LoadingSpinner } from './UI';

// Basic spinner
<LoadingSpinner />

// Spinner with text
<LoadingSpinner text="Loading..." />

// Different sizes
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />

// Different colors
<LoadingSpinner color="blue" />
<LoadingSpinner color="white" />
<LoadingSpinner color="green" />

// Full screen overlay
<LoadingSpinner fullScreen text="Loading application..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'blue' | 'white' | 'gray' | 'green' | 'red'
- `text`: string
- `fullScreen`: boolean

## Design Principles

1. **Consistency**: All components follow the same design patterns and spacing
2. **Accessibility**: Components include proper ARIA labels and keyboard navigation
3. **Responsiveness**: Components adapt to different screen sizes
4. **Customization**: Extensive prop options for different use cases
5. **Performance**: Optimized for minimal re-renders and bundle size

## Styling

All components use Tailwind CSS classes and follow a consistent design system:

- **Colors**: Blue primary (#3B82F6), Gray secondary (#6B7280)
- **Spacing**: 4px base unit (space-1 = 4px)
- **Typography**: Inter font family with consistent sizing
- **Shadows**: Subtle shadows for depth and hierarchy
- **Borders**: 1px borders with rounded corners

## Usage Guidelines

1. Import components from the UI index file
2. Use semantic HTML elements where possible
3. Provide proper labels and descriptions for accessibility
4. Test components across different screen sizes
5. Follow the established prop patterns for consistency