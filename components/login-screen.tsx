"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth"
import dynamic from 'next/dynamic'

const TodoList = dynamic(() => import('@/components/todo-list'), { ssr: false })

// Mock authentication function
const authenticateUser = async (email: string, password: string) => {
  // In a real app, this would make an API call to your backend
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
  if (email === "user@example.com" && password === "password") {
    return { success: true, user: { name: "John Doe", email } }
  }
  throw new Error("Invalid credentials")
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const handleSuccessfulLogin = (loggedInUser: any) => {
    if (!loggedInUser || (!loggedInUser.uid && !loggedInUser.id)) {
      console.error("Invalid user object:", loggedInUser);
      return;
    }
    const userId = loggedInUser.uid || loggedInUser.id || `user-${Date.now()}`;
    const updatedUser = { ...loggedInUser, uid: userId };
    console.log("Logged in user:", updatedUser);
    setUser(updatedUser);
    onLogin(updatedUser);
  };

  useEffect(() => {
    // Load the Google Sign-In API script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual Google Client ID
        callback: handleGoogleResponse
      })
    }
  }, [])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      handleSuccessfulLogin(userCredential.user)
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      handleSuccessfulLogin(result.user)
    } catch (err) {
      setError("Failed to authenticate with Google")
      toast({
        title: "Error",
        description: "Failed to authenticate with Google. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      handleSuccessfulLogin(userCredential.user)
    } catch (err) {
      setError("Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleResponse = async (response: any) => {
    setIsLoading(true)
    setError(null)
    try {
      // In a real app, you would send the ID token to your backend for verification
      const idToken = response.credential
      // Mock API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Mock user data with a uid
      const user = {
        name: "Google User",
        email: "google.user@example.com",
        uid: "google-user-id-" + Date.now() // Generate a mock uid
      }
      handleSuccessfulLogin(user)
    } catch (err) {
      setError("Failed to authenticate with Google")
      toast({
        title: "Error",
        description: "Failed to authenticate with Google. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Modify the isValidUser function to log the user object
  const isValidUser = (user: any): boolean => {
    console.log("Checking user validity:", user);
    return user !== null && typeof user.uid === 'string' && user.uid.length > 0;
  };

  // Add this useEffect for debugging
  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        handleSuccessfulLogin(user);
      }
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthenticating) {
    return <div>Authenticating...</div>;
  }

  return (
    <>
      {isValidUser(user) ? (
        <TodoList userId={user.uid} />
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Choose your preferred login method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="google">
                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? "Logging in..." : "Login with Google"}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full text-muted-foreground">
              Don't have an account? <a href="#" onClick={handleSignUp} className="underline">Sign up</a>
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  )
}