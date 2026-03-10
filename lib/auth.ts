import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.NODE_ENV === "development" && !process.env.GOOGLE_CLIENT_ID
      ? [
          CredentialsProvider({
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              const email = credentials?.email ?? "dev@subsave.local";
              let user = await prisma.user.findUnique({ where: { email } });
              if (!user) {
                user = await prisma.user.create({
                  data: { email, name: "Dev User" },
                });
              }
              return { id: user.id, email: user.email, name: user.name, image: user.image };
            },
          }),
        ]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PORT
      ? [
          EmailProvider({
            server: {
              host: process.env.EMAIL_SERVER_HOST,
              port: Number(process.env.EMAIL_SERVER_PORT),
              auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
              },
            },
            from: process.env.EMAIL_FROM ?? "SubSave <noreply@subsave.app>",
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.email = token.email ?? undefined;
        session.user.name = token.name ?? undefined;
        session.user.image = token.picture ?? undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.picture = user.image ?? undefined;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
