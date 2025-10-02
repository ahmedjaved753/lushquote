import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession, createBillingPortalSession } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Flower2,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Zap,
  Share2,
  BarChart3,
  Palette,
  Clock,
  Download,
  Lock,
  Sparkles,
  Star,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth/signup');
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth/signup');
      return;
    }

    try {
      const { data } = await createCheckoutSession();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not start upgrade process. Please try again.');
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data } = await createBillingPortalSession();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not open billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Stripe portal error:', error);
      toast.error('Could not open billing portal. Please try again.');
    }
  };

  const isPremium = user?.user_metadata?.subscription_tier === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/40">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">LushQuote</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
                How it works
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
                Pricing
              </button>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {!loading && (
                <>
                  {!user ? (
                    <>
                      <Link to="/auth/login">
                        <Button variant="ghost" className="text-gray-600">Sign in</Button>
                      </Link>
                      <Button onClick={handleGetStarted} className="bg-green-600 hover:bg-green-700">
                        Get started free
                      </Button>
                    </>
                  ) : (
                    <Link to="/dashboard">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Go to Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-green-100 bg-white"
          >
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 text-gray-600 hover:bg-green-50 rounded-lg">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-3 py-2 text-gray-600 hover:bg-green-50 rounded-lg">
                How it works
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-3 py-2 text-gray-600 hover:bg-green-50 rounded-lg">
                Pricing
              </button>
              <Separator />
              {!loading && (
                <>
                  {!user ? (
                    <>
                      <Link to="/auth/login" className="block">
                        <Button variant="ghost" className="w-full justify-start">Sign in</Button>
                      </Link>
                      <Button onClick={handleGetStarted} className="w-full bg-green-600 hover:bg-green-700">
                        Get started free
                      </Button>
                    </>
                  ) : (
                    <Link to="/dashboard" className="block">
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Go to Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Quotes your clients can{' '}
                <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  understand
                </span>
                .<br />
                Speed your team can{' '}
                <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  feel
                </span>
                .
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Create shareable, trackable quote forms with live price calculation.
              Get client information faster and close deals with clarity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all text-lg px-8 h-12"
              >
                Get started free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={() => scrollToSection('how-it-works')}
                size="lg"
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50 text-lg px-8 h-12"
              >
                View demo
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-sm text-gray-500"
            >
              Free plan includes 1 template and 25 submissions/month. No credit card required.
            </motion.p>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <Card className="border-2 border-green-200 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <CardTitle>Sample Quote Template</CardTitle>
                <CardDescription className="text-green-50">
                  Live price calculation for your services
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Website Design</p>
                      <p className="text-sm text-gray-500">Custom design for your brand</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">$2,500</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Development</p>
                      <p className="text-sm text-gray-500">Per hour</p>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">$150/hr</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4">
                    <p className="text-lg font-bold text-gray-900">Total Estimate</p>
                    <p className="text-2xl font-bold text-green-600">$3,500</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Value Props */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to quote faster
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features designed to streamline your quoting process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Palette,
                title: 'Custom templates',
                description: 'Create templates that fit your unique services and pricing models'
              },
              {
                icon: Zap,
                title: 'Live price calculation',
                description: 'Clients see real-time totals as they select services'
              },
              {
                icon: Share2,
                title: 'Shareable forms',
                description: 'Send a simple link to clients for easy quote requests'
              },
              {
                icon: BarChart3,
                title: 'Track everything',
                description: 'Monitor all submissions in one organized dashboard'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-green-100 hover:border-green-300 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How it works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to start collecting quotes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Create a template',
                description: 'Set up your services with fixed prices, per-unit rates, or recurring fees'
              },
              {
                step: '2',
                title: 'Share the link',
                description: 'Send your unique public form link to potential clients via email or your website'
              },
              {
                step: '3',
                title: 'Track and follow up',
                description: 'Receive submissions in your dashboard and update status as you close deals'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for flexibility
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Customize every aspect of your quote forms
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Palette,
                title: 'Brand your forms',
                description: 'Customize header colors to match your brand identity'
              },
              {
                icon: Clock,
                title: 'Date & time requests',
                description: 'Optionally collect preferred service dates and times from clients'
              },
              {
                icon: Lock,
                title: 'Footer branding control',
                description: 'Premium users can remove or customize the footer branding'
              },
              {
                icon: Download,
                title: 'CSV export',
                description: 'Export all submission data for analysis (Premium feature)'
              },
              {
                icon: BarChart3,
                title: 'Submission status pipeline',
                description: 'Track quotes through stages: new, contacted, quoted, closed, lost'
              },
              {
                icon: Sparkles,
                title: 'Drag-and-drop ordering',
                description: 'Arrange your services in the perfect order for your clients'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="border-green-100 hover:border-green-300 hover:shadow-md transition-all h-full">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free. Scale when you're ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-2 border-green-200 h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {[
                      '1 quote template',
                      '25 submissions per month',
                      'Live price calculation',
                      'Customizable branding',
                      '"Powered by LushQuote" footer',
                      'Email notifications'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleGetStarted}
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                    size="lg"
                  >
                    {user ? 'Go to Dashboard' : 'Get started free'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-2 border-green-600 shadow-xl relative h-full">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                  Most Popular
                </Badge>
                <CardHeader>
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$19.99</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {[
                      'Unlimited templates',
                      'Unlimited submissions',
                      'Live price calculation',
                      'Customizable branding',
                      'Remove/customize footer branding',
                      'CSV export of all data',
                      'Priority email support'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!user ? (
                    <Button
                      onClick={handleUpgrade}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Star className="w-5 h-5 mr-2" />
                      Upgrade to Premium
                    </Button>
                  ) : isPremium ? (
                    <Button
                      onClick={handleManageBilling}
                      variant="outline"
                      className="w-full border-green-600 text-green-700 hover:bg-green-50"
                      size="lg"
                    >
                      Manage Billing
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Star className="w-5 h-5 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Start in minutes. Close faster.
          </h2>
          <p className="mt-4 text-lg text-green-50">
            Join businesses using LushQuote to streamline their quoting process
          </p>
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="mt-8 bg-white text-green-700 hover:bg-green-50 shadow-xl text-lg px-8 h-12"
          >
            Get started free
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-green-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">LushQuote</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-green-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-green-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-green-600 transition-colors">Contact</a>
            </div>

            <div className="text-sm text-gray-500">
              © 2025 LushQuote. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
