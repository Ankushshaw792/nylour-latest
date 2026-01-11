import { ArrowRight, Store, Users, TrendingUp, Clock, DollarSign, Shield, CheckCircle, Smartphone, BarChart3, Calendar, Bell, Star, Phone, Mail, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SalonAuthSheet } from "@/components/auth/SalonAuthSheet";
import { SalonRegistrationForm } from "@/components/salon/SalonRegistrationForm";
import { useSalonExistence } from "@/hooks/useSalonExistence";
export default function SalonRegister() {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  const {
    hasSalon,
    loading: salonLoading
  } = useSalonExistence();
  const [showAuth, setShowAuth] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Check if user has a salon and redirect to dashboard
  useEffect(() => {
    if (!loading && !salonLoading && user && hasSalon) {
      navigate('/salon-dashboard');
    }
  }, [user, loading, hasSalon, salonLoading, navigate]);

  // Check if user is authenticated but no salon, show registration form
  useEffect(() => {
    if (user && !loading && !salonLoading && !hasSalon) {
      setShowRegistrationForm(true);
    }
  }, [user, loading, hasSalon, salonLoading]);
  const handleAuthSuccess = () => {
    setShowAuth(false);
    setShowRegistrationForm(true);
  };

  // Show loading state
  if (loading || salonLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }

  // If user is authenticated and has no salon, show registration form
  if (showRegistrationForm) {
    return <SalonRegistrationForm />;
  }
  const benefits = [{
    icon: Users,
    title: "Smart Queue Management",
    description: "Eliminate crowded waiting areas with real-time digital queue management"
  }, {
    icon: TrendingUp,
    title: "Increase Revenue by 30%",
    description: "Reduce no-shows and optimize scheduling to boost your earnings"
  }, {
    icon: Smartphone,
    title: "Mobile-First Dashboard",
    description: "Manage your salon anywhere with our intuitive mobile dashboard"
  }, {
    icon: Bell,
    title: "Automated Notifications",
    description: "Keep customers informed with automatic SMS and app notifications"
  }, {
    icon: BarChart3,
    title: "Business Analytics",
    description: "Track performance, revenue, and customer trends with detailed insights"
  }, {
    icon: Shield,
    title: "Zero Setup Costs",
    description: "Start for free with no hidden fees or expensive hardware required"
  }];
  const steps = [{
    number: "01",
    title: "Register Your Salon",
    description: "Fill in your salon details, services, and operating hours in just 5 minutes"
  }, {
    number: "02",
    title: "Set Up Services & Pricing",
    description: "Add your services, set prices, and customize your booking preferences"
  }, {
    number: "03",
    title: "Start Accepting Bookings",
    description: "Go live instantly and start receiving bookings from nearby customers"
  }];
  const stats = [{
    stat: "500+",
    description: "Salons Already Using Nylour",
    subtext: "Join the growing community"
  }, {
    stat: "40%",
    description: "Average Reduction in Wait Times",
    subtext: "Happier customers, smoother operations"
  }, {
    stat: "₹50K+",
    description: "Additional Monthly Revenue",
    subtext: "Boost your earnings effortlessly"
  }];
  const testimonials = [{
    quote: "Nylour transformed how we manage customers. Our revenue increased by 35% in just 3 months!",
    author: "Rajesh Kumar",
    salon: "Elite Hair Studio, Mumbai",
    rating: 5
  }, {
    quote: "No more crowded waiting areas. Customers love the convenience and we love the efficiency.",
    author: "Priya Sharma",
    salon: "Glamour Salon, Delhi",
    rating: 5
  }];
  const faqs = [{
    question: "How much does it cost to register my salon?",
    answer: "Registration is completely FREE! We only charge a small commission (3-5%) on successful bookings through our platform. No setup fees, no monthly charges."
  }, {
    question: "How long does it take to set up my salon?",
    answer: "You can complete the registration in under 10 minutes. Once approved (usually within 24 hours), you can start accepting bookings immediately."
  }, {
    question: "Do I need special hardware or equipment?",
    answer: "No special hardware required! You just need a smartphone or tablet to manage bookings. Our platform works on any device with internet access."
  }, {
    question: "How will customers find my salon?",
    answer: "Your salon will be listed in our app for customers searching in your area. We also provide marketing tools and help optimize your listing for maximum visibility."
  }, {
    question: "What about walk-in customers?",
    answer: "You can easily add walk-in customers to your digital queue through the dashboard. This helps you manage both online bookings and walk-ins seamlessly."
  }, {
    question: "How and when do I get paid?",
    answer: "Payments are processed automatically. You receive the service amount directly from customers, and we deduct our small commission only from successful bookings."
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold gradient-text">Nylour</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setShowAuth(true)} className="text-muted-foreground hover:text-foreground">
                Already have an account? Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Grow Your Salon<br />
                Business with<br />
                <span className="gradient-text bg-white text-transparent bg-clip-text">Smart Technology</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-white/90 leading-relaxed">
                Join 500+ salons using Nylour to reduce wait times, increase bookings, and boost revenue by 30%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="xl" variant="secondary" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90 font-semibold" onClick={() => setShowAuth(true)}>
                  Register Your Salon FREE
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="xl" variant="outline" className="text-lg px-8 py-4 text-white hover:text-primary font-semibold bg-primary border-primary">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-80 h-96 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center">
                  <Store className="h-32 w-32 text-white/70" />
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary rounded-full opacity-80 animate-pulse" />
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary-light rounded-full opacity-60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 gradient-text">
              Why Choose Nylour for Your Salon?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform your salon operations with cutting-edge technology designed specifically for beauty businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => <Card key={index} className="card-hover h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <benefit.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Launch your digital salon presence in under 10 minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => <div key={index} className="text-center relative">
                {index < steps.length - 1 && <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-primary opacity-30 z-0" />}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Trusted by Salon Owners Across India
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join the growing community of successful salon owners
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold mb-2">
                  {stat.stat}
                </div>
                <p className="text-white/90 text-lg font-medium mb-1">{stat.description}</p>
                <p className="text-white/60 text-sm">{stat.subtext}</p>
              </div>)}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="text-white mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="text-white font-semibold">{testimonial.author}</p>
                    <p className="text-white/70 text-sm">{testimonial.salon}</p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about registering your salon with Nylour
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="bg-card border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Salon?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of salon owners who are already growing their business with Nylour
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="secondary" className="text-lg px-8 py-4 bg-white text-primary hover:bg-white/90 font-semibold" onClick={() => setShowAuth(true)}>
              Start Your Free Registration
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="xl" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:text-primary font-semibold bg-primary">
              Schedule a Demo Call
              <Phone className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">Nylour</h3>
              <p className="text-muted-foreground mb-4">
                Empowering salons with smart technology to grow their business.
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Salons</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Register Your Salon</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Success Stories</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Nylour. All rights reserved. Built for salon owners, by salon enthusiasts.</p>
          </div>
        </div>
      </footer>

      {/* Authentication Sheet */}
      <SalonAuthSheet open={showAuth} onOpenChange={setShowAuth} onAuthSuccess={handleAuthSuccess} />
    </div>;
}