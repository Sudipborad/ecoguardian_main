import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recycle, Trash2, Award, Info, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const HomePage = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-30 h-16">
        <div className="container mx-auto flex h-full items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Eco Guardian</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('home')} 
              className="text-sm font-medium hover:text-primary"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm font-medium hover:text-primary"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              className="text-sm font-medium hover:text-primary"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="text-sm font-medium hover:text-primary"
            >
              About
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <div className="flex gap-2">
                <Link to="/sign-in">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Making Recycling <span className="text-primary">Simple</span> and <span className="text-primary">Effective</span></h1>
                <p className="text-xl text-muted-foreground">
                  Eco Guardian connects communities with waste management services for a cleaner, greener environment.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link to="/sign-up">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="#how-it-works">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="relative w-[350px] h-[350px] rounded-full bg-primary/5 flex items-center justify-center">
                  <Recycle className="w-32 h-32 text-primary" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Eco Guardian provides a comprehensive waste management solution connecting community members, officers, and administrators.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Trash2 className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Report Recyclables</h3>
                    <p className="text-muted-foreground">
                      Easily report recyclable items with photos, location, and details for efficient collection.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Recycle className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Track Collection</h3>
                    <p className="text-muted-foreground">
                      Follow the status of your reported recyclables and get notified when they're collected.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Award className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Community Impact</h3>
                    <p className="text-muted-foreground">
                      See how your recycling efforts contribute to a cleaner, more sustainable community.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our simple 3-step process makes recycling easy and efficient for everyone.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-bold mb-2">Report</h3>
                <p className="text-muted-foreground">Take a photo of recyclable items, add details, and submit your report.</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-bold mb-2">Collection</h3>
                <p className="text-muted-foreground">Waste management officers review and schedule the pickup of your items.</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-background text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-bold mb-2">Recycle</h3>
                <p className="text-muted-foreground">Items are collected and properly recycled, reducing environmental impact.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* About Section */}
        <section id="about" className="py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">About Eco Guardian</h2>
                <p className="text-muted-foreground mb-6">
                  Eco Guardian was founded with a mission to simplify waste management and promote recycling in communities. 
                  Our platform bridges the gap between residents and waste management services.
                </p>
                <p className="text-muted-foreground mb-6">
                  We believe that sustainable waste management is essential for environmental conservation and a better future.
                  By making recycling more accessible, we hope to create cleaner, more sustainable communities.
                </p>
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-primary mr-2" />
                  <p className="text-sm">Join us in our mission for a cleaner world.</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="relative w-[300px] h-[300px] rounded-full bg-primary/5 flex items-center justify-center overflow-hidden">
                  <svg className="absolute inset-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#22c55e" d="M40.8,-60.5C54.1,-51.3,67.1,-41.6,73.3,-28.2C79.4,-14.8,78.7,2.1,73.1,16.6C67.5,31,57,42.9,44.4,52.1C31.8,61.3,17.1,67.7,1.2,66.1C-14.7,64.6,-31.5,55.1,-43.5,43.3C-55.5,31.4,-62.6,17.1,-65.3,1.7C-68.1,-13.7,-66.5,-30.4,-57.8,-41.8C-49.1,-53.2,-33.3,-59.2,-18.9,-67.5C-4.5,-75.8,9.5,-86.4,22.5,-83.7C35.6,-81,47.5,-65,40.8,-60.5Z" transform="translate(100 100)" />
                  </svg>
                  <div className="relative z-10 bg-background p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Our Impact</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-bold text-primary">10,000+</span> Items Recycled
                      </div>
                      <div>
                        <span className="font-bold text-primary">5,000+</span> Active Users
                      </div>
                      <div>
                        <span className="font-bold text-primary">100+</span> Communities Served
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Recycling?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join Eco Guardian today and be part of the solution for a cleaner, more sustainable future.
            </p>
            <Link to="/sign-up">
              <Button size="lg" className="px-8">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="border-t py-8 bg-muted/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Recycle className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Eco Guardian</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Connecting communities for better waste management and recycling.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link to="#features" className="text-muted-foreground hover:text-primary">Features</Link></li>
                <li><Link to="#how-it-works" className="text-muted-foreground hover:text-primary">How It Works</Link></li>
                <li><Link to="#about" className="text-muted-foreground hover:text-primary">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link to="#" className="text-muted-foreground hover:text-primary">Cookie Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">support@ecoguardian.com</li>
                <li className="text-muted-foreground">+1 (555) 123-4567</li>
                <li className="text-muted-foreground">123 Green Street, Eco City</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Eco Guardian. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
