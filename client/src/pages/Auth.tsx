import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, ShieldCheck } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return <Redirect to={user.role === 'coach' ? '/dashboard' : '/athlete/check-in'} />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  const handleRegister = (role: 'coach' | 'athlete') => (e: React.FormEvent) => {
    e.preventDefault();
    register({ username, password, role });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_-10px_rgba(var(--primary),0.4)]">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-display uppercase tracking-tight">Iron OS</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Prep Coach Operating System</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/50 p-1">
              <TabsTrigger value="login" className="font-display tracking-wide uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Login</TabsTrigger>
              <TabsTrigger value="register" className="font-display tracking-wide uppercase data-[state=active]:bg-background data-[state=active]:text-primary">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 bg-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-secondary/30"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isLoggingIn}>
                  {isLoggingIn ? "Accessing..." : "Enter Portal"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <Tabs defaultValue="athlete" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-transparent">
                  <TabsTrigger value="athlete" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20">Athlete</TabsTrigger>
                  <TabsTrigger value="coach" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20">Coach</TabsTrigger>
                </TabsList>
                
                <TabsContent value="athlete">
                  <form onSubmit={handleRegister('athlete')} className="space-y-4">
                    <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 bg-secondary/30"/>
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-secondary/30"/>
                    <Button type="submit" className="w-full h-12 font-bold uppercase tracking-wider" disabled={isRegistering}>
                      {isRegistering ? "Creating..." : "Join Team"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="coach">
                  <form onSubmit={handleRegister('coach')} className="space-y-4">
                     <div className="p-3 mb-2 rounded bg-yellow-500/10 border border-yellow-500/20 flex gap-3">
                       <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0" />
                       <p className="text-xs text-yellow-200/80 leading-relaxed">Coach accounts have dashboard access to manage athletes.</p>
                     </div>
                    <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 bg-secondary/30"/>
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-secondary/30"/>
                    <Button type="submit" variant="outline" className="w-full h-12 font-bold uppercase tracking-wider border-primary text-primary hover:bg-primary/10" disabled={isRegistering}>
                      {isRegistering ? "Creating..." : "Create Coach Profile"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
