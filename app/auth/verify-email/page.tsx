import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check your email inbox and click the verification link to activate your account.
            The link will expire in 24 hours.
          </p>
          <p className="text-sm text-muted-foreground">
            After verifying your email, you can log in to your account.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Go to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
