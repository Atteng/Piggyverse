import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import TwitterProvider from "next-auth/providers/twitter";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

// Custom Adapter to ensure username is saved and fields are mapped correctly
const CustomPrismaAdapter = PrismaAdapter(prisma);
const _createUser = CustomPrismaAdapter.createUser;
CustomPrismaAdapter.createUser = (data: any) => {
    return prisma.user.create({
        data: {
            username: data.username || `user-${Date.now()}`,
            email: data.email,
            avatarUrl: data.image, // Map image to avatarUrl
            // We consciously ignore 'name' and 'emailVerified' as they are not in our schema
        },
    });
};

export const authOptions: NextAuthOptions = {
    adapter: CustomPrismaAdapter,
    providers: [
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID!,
            clientSecret: process.env.TWITTER_CLIENT_SECRET!,
            version: "2.0",
            profile(profile) {
                console.log("Twitter Profile:", profile);
                const rawUsername = profile.data.username || `user${profile.data.id}`;
                return {
                    id: profile.data.id,
                    email: null,
                    image: profile.data.profile_image_url,
                    username: rawUsername,
                };
            },
        }),
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: { params: { scope: 'identify' } },
            profile(profile) {
                console.log("Discord Profile:", profile);
                const rawUsername = profile.username || `user${profile.id}`;
                return {
                    id: profile.id,
                    email: null,
                    image: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
                    username: rawUsername,
                };
            },
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
    session: {
        strategy: "database",
    },
    debug: true, // Enable debugging
};
