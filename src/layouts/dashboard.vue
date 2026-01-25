<script setup lang="ts">
import { signOut } from "firebase/auth";
import { LogOutIcon } from "lucide-vue-next";
import { ROUTE, MENU_GROUPS, MENU_GROUPS_LABELS, type MenuGroup, type IRoute } from "@/static/routes";

const userStore = useUserStore();
const firebaseStore = useFirebaseStore();
const { currentUser } = storeToRefs(userStore);
const router = useRouter();
const route = useRoute();

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
  if (url === ROUTE.dashboard.path()) {
    return route.path === ROUTE.dashboard.path();
  }
  return route.path.startsWith(url);
};

type RouteWithMenu = IRoute & { menu: { icon: any; group: MenuGroup } };

const hasMenu = (routeItem: IRoute): routeItem is RouteWithMenu => {
  return 'menu' in routeItem && routeItem.menu !== undefined;
};

const menuGroups = computed(() => {
  const groups: Record<MenuGroup, RouteWithMenu[]> = {
    overview: [],
    management: [],
  };

  Object.values(ROUTE).forEach((routeItem) => {
    if (hasMenu(routeItem)) {
      groups[routeItem.menu.group].push(routeItem);
    }
  });

  return MENU_GROUPS.map((groupKey) => ({
    key: groupKey,
    label: MENU_GROUPS_LABELS[groupKey],
    items: groups[groupKey],
  })).filter((group) => group.items.length > 0);
});
</script>

<template>
  <UiSidebarProvider>
    <UiSidebar>
      <UiSidebarHeader class="border-b p-4">
        <NuxtLink :to="ROUTE.dashboard.path()" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            💰
          </div>
          <div>
            <h1 class="font-bold text-lg leading-tight">Finance Manager</h1>
            <p class="text-xs text-muted-foreground">Controle Financeiro</p>
          </div>
        </NuxtLink>
      </UiSidebarHeader>

      <UiSidebarContent>
        <UiSidebarGroup v-for="group in menuGroups" :key="group.key">
          <UiSidebarGroupLabel>{{ group.label }}</UiSidebarGroupLabel>
          <UiSidebarGroupContent>
            <UiSidebarMenu>
              <UiSidebarMenuItem v-for="item in group.items" :key="item.name">
                <UiSidebarMenuButton
                  :as-child="true"
                  :is-active="isActive(item.path())"
                >
                  <NuxtLink :to="item.path()" class="flex items-center gap-3">
                    <component :is="item.menu.icon" class="h-4 w-4" />
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </UiSidebarMenuButton>
              </UiSidebarMenuItem>
            </UiSidebarMenu>
          </UiSidebarGroupContent>
        </UiSidebarGroup>
      </UiSidebarContent>

      <UiSidebarFooter class="border-t p-4">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <button class="flex items-center gap-3 w-full hover:bg-muted rounded-lg p-2 cursor-pointer transition-colors">
              <UiAvatar class="h-8 w-8">
                <UiAvatarImage v-if="currentUser?.imageUrl" :src="currentUser.imageUrl" />
                <UiAvatarFallback>{{ getUserInitials }}</UiAvatarFallback>
              </UiAvatar>
              <div class="flex-1 text-left min-w-0">
                <p class="text-sm font-medium truncate">{{ currentUser?.name || "Usuário" }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ currentUser?.email }}</p>
              </div>
            </button>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-56">
            <UiDropdownMenuLabel class="font-normal">
              <div class="flex flex-col space-y-1">
                <p class="text-sm font-medium leading-none">{{ currentUser?.name || "Usuário" }}</p>
                <p class="text-xs leading-none text-muted-foreground">{{ currentUser?.email }}</p>
              </div>
            </UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem @click="handleSignOut" class="cursor-pointer">
              <LogOutIcon class="mr-2 h-4 w-4" />
              <span>Sair</span>
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiSidebarFooter>
    </UiSidebar>

    <main class="flex-1 overflow-auto">
      <div class="border-b bg-background sticky top-0 z-10">
        <div class="flex items-center gap-4 p-4">
          <UiSidebarTrigger />
          <div class="flex-1">
            <h2 class="text-lg font-semibold">{{ route.meta.title || 'Dashboard' }}</h2>
          </div>
        </div>
      </div>
      <div class="p-6">
        <slot />
      </div>
    </main>
  </UiSidebarProvider>
</template>
