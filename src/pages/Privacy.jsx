import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 select-none">Privacy Policy</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Athletic performance data (throws distances, dates, notes)</li>
              <li>Practice attendance and progress information</li>
              <li>Any other information you choose to provide</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Track and display your athletic progress</li>
              <li>Enable coaches to manage team practices and plans</li>
              <li>Send you updates about practice schedules and meets</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              We do not sell or share your personal information with third parties except:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who help us operate the app</li>
            </ul>
            <p className="text-slate-700 mt-4">
              Your performance data is visible to your coaches and team administrators to facilitate training and progress tracking.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is ever fully secure or error-free.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">You have the right to:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Access and review your personal information</li>
              <li>Update or correct your information</li>
              <li>Delete your account and data</li>
              <li>Request a copy of your data</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              This application is designed for high school athletes. If you are under 13, please ensure you have parental consent before using this app. Parents and guardians may contact us to review, modify, or delete their child's information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-slate-500 mt-4 text-sm">Last Updated: February 12, 2026</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              If you have any questions about this privacy policy or our practices, please contact your team administrator or coach.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}