'use client';

import { Header } from '@/components/Header';
import { Shield, Lock, EyeOff, Database, Mail, Globe, Users } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-blue-100 selection:text-blue-900">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                <div className="space-y-12">
                    {/* Hero Section */}
                    <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                            At OneSheet, we believe your data is yours. Our architecture is built 
                            around privacy and local-first principles.
                        </p>
                        <div className="text-sm text-muted-foreground pt-2">
                            Last Updated: April 7, 2026
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                        <aside className="p-8 bg-card border border-border rounded-3xl shadow-sm space-y-4">
                            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                                <Database className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold">Local-First Storage</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Your OneSheet compositions are stored exclusively in your browser's local 
                                storage. We do not have a backend server that stores your music data.
                            </p>
                        </aside>

                        <aside className="p-8 bg-card border border-border rounded-3xl shadow-sm space-y-4">
                            <div className="h-12 w-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                                <Lock className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold">Zero Data Collection</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                OneSheet does not collect personally identifiable information (PII). We 
                                don't track your identity, your location, or your usage patterns.
                            </p>
                        </aside>
                    </div>

                    {/* Detailed Content */}
                    <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">1. Information We Collect</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong>User Content:</strong> Unlike traditional cloud-based applications, OneSheet does not require an 
                                account. We do not collect your name, email address, or any other private information. 
                                Your compositions are text-based and stay within your local browser environment.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                <strong>Log Data:</strong> Like most web applications, we may automatically collect standard technical information 
                                such as your IP address, browser type, and operating system via our hosting infrastructure. This 
                                information is used strictly for technical performance and security.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">2. How Your Data is Used</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Since all music data is local, it never leaves your machine unless you explicitly share it. 
                                When you share a link to a composition, the data is typically encoded into the URL itself 
                                (if using URL sharing) or remains in your local storage. We do not use your data for advertising 
                                or sale to third parties.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">3. Cookies and Local Storage</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We utilize <strong>Local Storage</strong> and <strong>Session Storage</strong> 
                                to maintain your project state and application settings (like dark mode 
                                and mobile warnings). These are standard browser features used to improve 
                                your experience and are not used for tracking your activity across other sites.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">4. Third-Party Services</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                OneSheet is hosted on third-party infrastructure (such as Vercel). These providers may 
                                collect technical logs necessary for serving the application. We recommend reviewing 
                                the privacy policies of our hosting providers if you have concerns about server-level logging.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">5. Your Legal Rights (GDPR & CCPA)</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Depending on your location, you may have rights under the General Data Protection Regulation (GDPR) 
                                or the California Consumer Privacy Act (CCPA). This includes:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>The right to access and receive a copy of your data (available via local backup).</li>
                                <li>The right to rectification or erasure of your data (available by clearing browser storage).</li>
                                <li>The right to restrict or object to certain processing (we perform no server-side processing).</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold border-b pb-2">6. Children's Privacy</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                OneSheet is not intended for use by children under the age of 13. We do not knowingly collect 
                                personally identifiable information from children. If you are a parent or guardian and realize 
                                your child has provided us with personal data, please contact us.
                            </p>
                        </section>

                        <section className="space-y-4 p-8 bg-muted/50 rounded-3xl border border-border mt-12">
                            <div className="flex items-center gap-4 mb-4">
                                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <h2 className="text-2xl font-bold">7. Contact Us</h2>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about this Privacy Policy or our data practices, please 
                                reach out to us at:
                            </p>
                            <div className="mt-4 font-mono text-blue-600 dark:text-blue-400">
                                support@onesheet.app
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
