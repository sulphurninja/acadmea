"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="shadow px-6 py-4 bg-background">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* <img src='/logo.png' alt="EduManager Logo" className="h-12"/> */}
            <span className="font-bold text-xl">EduManager</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="#features" className="hover:text-primary transition">Features</Link>
            <Link href="#modules" className="hover:text-primary transition">Modules</Link>
            <Link href="#testimonials" className="hover:text-primary transition">Testimonials</Link>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button asChild variant="outline">
              <Link className="text-muted-foreground" href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
          <Button variant="ghost" className="md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </Button>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="container  mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1">All-in-one Solution</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          <span className="text-primary">Modern.</span> <span className="text-muted-foreground">Efficient.</span> <span className="text-foreground">Education.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          EduManager provides a comprehensive school management system that streamlines administration, enhances teaching, and improves parent-teacher communication.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button asChild size="lg">
            <Link href="/register">Start Free Trial</Link>
          </Button>
          <Button className="text-muted-foreground" asChild size="lg" variant="outline">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
        <div className="relative w-full max-w-4xl mt-8 h-[300px] md:h-[400px] rounded-lg border shadow-lg overflow-hidden">
          <Image
            src="/dashboard.png"
            alt="Dashboard Preview"
            fill
            className="object-cover"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Trusted by over 1000+ schools worldwide</p>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose EduManager?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Streamlined Administration",
                description: "Automate attendance, grades, scheduling and administrative tasks to save time and reduce errors.",
                icon: "📊"
              },
              {
                title: "Enhanced Communication",
                description: "Connect teachers, students, and parents through a centralized platform for announcements and progress tracking.",
                icon: "💬"
              },
              {
                title: "Data-Driven Insights",
                description: "Access comprehensive reports and analytics to make informed decisions about student performance and school operations.",
                icon: "📈"
              }
            ].map((item, i) => (
              <div key={i} className="bg-card border rounded-lg p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl text-m font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 text-center">Comprehensive Modules</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            EduManager provides all the tools you need to manage your educational institution efficiently.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Student Management",
                icon: "👨‍🎓",
                features: ["Enrollment tracking", "Academic records", "Attendance monitoring", "Performance analytics"]
              },
              {
                name: "Teacher Portal",
                icon: "👩‍🏫",
                features: ["Class management", "Grade submission", "Lesson planning", "Resource sharing", "Communication tools"]
              },
              {
                name: "Parent Engagement",
                icon: "👪",
                features: ["Real-time updates", "Progress tracking", "Direct messaging", "Fee payment", "Event notifications"]
              },
              {
                name: "Administration",
                icon: "🏫",
                features: ["Staff management", "Financial tracking", "Resource allocation", "Reporting"]
              },
              {
                name: "Timetable & Scheduling",
                icon: "🗓️",
                features: ["Automatic scheduling", "Conflict detection", "Room allocation", "Calendar integration"]
              },
              {
                name: "Examination System",
                icon: "📝",
                features: ["Exam creation", "Grading tools", "Result analysis", "Progress reports"]
              }
            ].map((module, i) => (
              <Card key={i} className="border hover:shadow-md transition">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{module.icon}</span>
                    <CardTitle className="text-xl text-muted-foreground">{module.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <svg className="text-primary w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-card-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "EduManager has transformed how we manage our school. Administrative tasks that used to take days now take minutes.",
                author: "Sarah Johnson",
                role: "Principal, Westview High School"
              },
              {
                quote: "As a teacher, I appreciate how easy it is to track attendance, submit grades, and communicate with parents all in one platform.",
                author: "Michael Chen",
                role: "Science Teacher, Lincoln Middle School"
              },
              {
                quote: "The parent portal gives me real-time insights into my children's education. I feel more connected to their school life than ever before.",
                author: "Amanda Rodriguez",
                role: "Parent"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="border">
                <CardContent className="pt-6">
                  <div className="mb-4 text-primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 11L7 16H5L7 11H5V7H10V11ZM18 11L15 16H13L15 11H13V7H18V11Z" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground mb-4">{testimonial.quote}</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your school management?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Join thousands of educational institutions already using EduManager to streamline operations and enhance learning outcomes.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">Start Your Free 30-Day Trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-10 mt-auto">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4 text-foreground">EduManager</h3>
              <p className="text-muted-foreground text-sm">
                Complete school management solution for modern educational institutions.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-foreground">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Tutorials</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-foreground">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-foreground">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Support</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Sales</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Demo Request</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2023 EduManager. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
