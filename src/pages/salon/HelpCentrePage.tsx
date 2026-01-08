import { useState } from "react";
import { ArrowLeft, Phone, Mail, MessageCircle, Send, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const HelpCentrePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const SUPPORT_PHONE = "+91 70031 07472";
  const SUPPORT_EMAIL = "ankushshaw007@gmail.com";

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in your name and message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Message sent",
      description: "We'll get back to you as soon as possible.",
    });

    setFormData({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/salon-dashboard/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Help Centre</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Contact Options */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-5 w-5" />
              Contact Us
            </CardTitle>
            <CardDescription>
              Get in touch with our support team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
              className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Call Us</p>
                <p className="text-xs text-muted-foreground">{SUPPORT_PHONE}</p>
              </div>
            </a>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Email Us</p>
                <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
              </div>
            </a>

            <div
              className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30 opacity-60 cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100/50 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600/50" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
              </div>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form - Coming Soon */}
        <Card className="border shadow-sm opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-muted-foreground">Send a Message</CardTitle>
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
            <CardDescription>
              Fill out the form and we'll get back to you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-muted-foreground">Your Name *</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                className="mt-1.5"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-muted-foreground">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="mt-1.5"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-muted-foreground">Message *</Label>
              <Textarea
                id="message"
                placeholder="How can we help you?"
                className="mt-1.5"
                rows={4}
                disabled
              />
            </div>
            <Button disabled className="w-full gap-2">
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <Card className="border shadow-sm bg-muted/30">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need quick answers? Check our{" "}
              <span className="text-primary font-medium cursor-pointer hover:underline">
                FAQ section
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCentrePage;
