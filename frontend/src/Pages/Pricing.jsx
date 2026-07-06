import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Building2, Crown } from 'lucide-react';
import Card from '../Components/UI/Card';
import Button from '../Components/UI/Button';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    icon: Zap,
    features: ['Up to 10 events/month', '5 team members', 'Basic analytics', 'Email support', 'Community access'],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Starter',
    price: 29,
    period: '/month',
    description: 'For growing teams',
    icon: Building2,
    features: ['Up to 50 events/month', '20 team members', 'Advanced analytics', 'Custom branding', 'Priority email support', 'Calendar integrations'],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Pro',
    price: 79,
    period: '/month',
    description: 'For professional organizers',
    icon: Crown,
    features: ['Up to 200 events/month', '100 team members', 'AI-powered features', 'API access', 'Slack integration', 'Priority support', 'Event templates'],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 199,
    period: '/month',
    description: 'For large organizations',
    icon: Building2,
    features: ['Unlimited events', 'Unlimited members', 'Custom domain', 'Dedicated support', 'SLA guarantee', 'Custom integrations', 'White-label', 'SSO/SAML'],
    cta: 'Contact Sales',
    popular: false
  }
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that's right for your team. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative p-6 flex flex-col ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <Icon className={`w-8 h-8 ${plan.popular ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>

                <div className="my-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
                  )}
                </div>

                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  fullWidth
                  className="mb-6"
                  onClick={() => window.location.href = plan.cta === 'Contact Sales' ? '/support' : '/register'}
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Questions? <Link to="/support" className="text-blue-600 hover:underline">Contact our team</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
