'use server'

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { setSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

// Server Action for user login
export async function login(formData: FormData) {
    // Extract email and password from the form submission
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate input fields
    if (!email || !password) {
        return { error: "Email and password are required" }
    }

    try {
        // Find the user by their email in the database
        const user = await prisma.user.findUnique({
            where: { email },
        })

        // Verify user exists and compare passwords using bcrypt
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return { error: "Invalid email or password." }
        }

        if (user.status === 'DEACTIVATED') {
            return { error: 'Your account has been deactivated. Please contact support.' };
        }

        // Establish session cookies (access token + refresh token)
        await setSession(user.id)

        // 6. Return user details on successful login
        return {
            success: true,
            role: user.role,
        };
    } catch (error: any) {
        console.error("[login] Error:", error)
        return { error: `Server error: ${error?.message ?? "Unknown"}` }
    }
}

// Server Action for registering a new user
export async function register(formData: FormData) {
    // Extract email and password from the registration form
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Validate inputs
    if (!email || !password) {
        return { error: "Email and password are required" }
    }

    try {
        // Hash the plain text password for secure storage
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create the new User record in the database
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        })

        // Automatically log the user in by setting the session cookies
        await setSession(user.id)

        return { success: true }
    } catch (error: any) {
        console.error("[register] Error:", error)
        // Check for Prisma unique constraint violation (duplicate email)
        if (error.code === "P2002") {
            return { error: "This email is already in use." }
        }
        return { error: `Server error: ${error?.message ?? "Unknown"}` }
    }
}

// Server Action to log a user out
export async function logout() {
    // Delete access and refresh token cookies
    await deleteSession();
    // Redirect back to the login page
    redirect('/login');
}

export async function validatePasswordStrength(password: string): Promise<string | null> {
    if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter (A-Z).';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter (a-z).';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number (0-9).';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must contain at least one special character (e.g., !@#$%^&*).';
    }
    return null;
}

// Server Action for approved members setting up their password for the first time
export async function setupPassword(formData: FormData) {
    const email = (formData.get("email") as string || '').trim().toLowerCase();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    const passwordError = await validatePasswordStrength(password);
    if (passwordError) {
        return { error: passwordError };
    }

    if (confirmPassword && password !== confirmPassword) {
        return { error: "Passwords do not match." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "No user account found for this email. Please contact support or request approval." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                status: 'ACTIVE',
            },
        });

        await setSession(user.id);
        return { success: true, role: user.role };
    } catch (error: any) {
        console.error("[setupPassword] Error:", error);
        return { error: `Failed to set password: ${error?.message || "Unknown error"}` };
    }
}



