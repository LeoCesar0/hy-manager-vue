<script setup lang="ts">
import { signOut } from "firebase/auth";
import {
  UiSidebar,
  UiSidebarContent,
  UiSidebarFooter,
  UiSidebarGroup,
  UiSidebarGroupContent,
  UiSidebarGroupLabel,
  UiSidebarHeader,
  UiSidebarMenu,
  UiSidebarMenuButton,
  UiSidebarMenuItem,
  UiSidebarProvider,
  UiSidebarTrigger,
} from "~/components/ui/sidebar";
import {
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { UiAvatar, UiAvatarFallback, UiAvatarImage } from "~/components/ui/avatar";

const userStore = useUserStore();
const firebaseStore = useFirebaseStore();
const { currentUser } = storeToRefs(userStore);
const router = useRouter();
const route = useRoute();

const navigation = [
  {
    title: "Dashboard",
    items: [
      { title: "Overview", url: "/dashboard", icon: "📊" },
      { title: "Transactions", url: "/dashboard/transactions", icon: "💰" },
    ],
  },
  {
    title: "Management",
    items: [
      { title: "Bank Accounts", url: "/dashboard/bank-accounts", icon: "🏦" },
      { title: "Categories", url: "/dashboard/categories", icon: "📁" },
      { title: "Creditors", url: "/dashboard/creditors", icon: "👥" },
    ],
  },
];

const handleSignOut = async () => {
  await signOut(firebaseStore.firebaseAuth);
  router.push("/sign-in");
};

const getUserInitials = computed(() => {
  if (!currentUser.value) return "U";
  return currentUser.value.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const isActive = (url: string) => {
  if (url === "/dashboard") {
    return route.path === "/dashboard";
  }
  return route.path.startsWith(url);
};
</script>

<template>
  <UiSidebarProvider>
    <UiSidebar>
      <UiSidebarHeader class="border-b p-4">
        <div class="flex items-center gap-2">
          <div class="text-2xl">💼</div>
          <div>
            <h1 class="font-bold text-lg">Finance Manager</h1>
            <p class="text-xs text-muted-foreground">Personal Finance</p>
          </div>
        </div>
      </UiSidebarHeader>

      <UiSidebarContent>
        <UiSidebarGroup v-for="group in navigation" :key="group.title">
          <UiSidebarGroupLabel>{{ group.title }}</UiSidebarGroupLabel>
          <UiSidebarGroupContent>
            <UiSidebarMenu>
              <UiSidebarMenuItem v-for="item in group.items" :key="item.title">
                <UiSidebarMenuButton
                  :as-child="true"
                  :is-active="isActive(item.url)"
                >
                  <NuxtLink :to="item.url" class="flex items-center gap-2">
                    <span>{{ item.icon }}</span>
                    <span>{{ item.title }}</span>
                  </NuxtLink>
                </UiSidebarMenuButton>
              </UiSidebarMenuItem>
            </UiSidebarMenu>
          </UiSidebarGroupContent>
        </UiSidebarGroup>
      </UiSidebarContent>

      <UiSidebarFooter class="border-t p-4">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger class="w-full">
            <div class="flex items-center gap-3 w-full hover:bg-muted rounded-lg p-2 cursor-pointer">
              <UiAvatar class="h-8 w-8">
                <UiAvatarImage v-if="currentUser?.imageUrl" :src="currentUser.imageUrl" />
                <UiAvatarFallback>{{ getUserInitials }}</UiAvatarFallback>
              </UiAvatar>
              <div class="flex-1 text-left">
                <p class="text-sm font-medium">{{ currentUser?.name || "User" }}</p>
                <p class="text-xs text-muted-foreground">{{ currentUser?.email }}</p>
              </div>
            </div>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-56">
            <UiDropdownMenuLabel>My Account</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @click="handleSignOut">
              Sign out
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiSidebarFooter>
    </UiSidebar>

    <main class="flex-1 overflow-auto">
      <div class="border-b bg-background sticky top-0 z-10">
        <div class="flex items-center gap-4 p-4">
          <UiSidebarTrigger />
        </div>
      </div>
      <div class="p-6">
        <slot />
      </div>
    </main>
  </UiSidebarProvider>
</template>
