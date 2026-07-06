import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../Components/UI/Card';
import { Keyboard, ArrowLeft } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open search', context: 'Global' },
  { keys: ['Esc'], description: 'Close modal / search', context: 'Global' },
  { keys: ['⌘', 'D'], description: 'Toggle dark mode', context: 'Global' },
  { keys: ['Enter'], description: 'Submit form / search', context: 'Forms' },
  { keys: ['Tab'], description: 'Navigate between fields', context: 'Forms' },
  { keys: ['←', '→'], description: 'Navigate wizard steps', context: 'Create Event' },
];

const KeyboardShortcuts = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Keyboard className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h1>
      </div>

      <Card className="divide-y divide-gray-100 dark:divide-gray-700">
        {shortcuts.map((shortcut, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{shortcut.description}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{shortcut.context}</p>
            </div>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, j) => (
                <React.Fragment key={j}>
                  <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 shadow-sm">
                    {key}
                  </kbd>
                  {j < shortcut.keys.length - 1 && <span className="text-gray-400 text-xs">+</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Use ⌘ on Mac or Ctrl on Windows/Linux
      </p>
    </div>
  );
};

export default KeyboardShortcuts;
