<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { WalletIcon, PlusIcon, EditIcon, TrashIcon, MoreHorizontalIcon, EyeIcon } from "lucide-vue-next";
import type { IBankAccount, ICreateBankAccount } from "~/@schemas/models/bank-account";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";
import { deleteBankAccount } from "~/services/api/bank-accounts/delete-bank-account";
import { formatDate } from "~/helpers/formatDate";
import BankAccountForm from "~/components/BankAccounts/BankAccountForm.vue";
import SheetBody from "~/components/ui/sheet/SheetBody.vue";
import FancyLink from "~/components/FancyLink/index.vue";
import { ROUTE } from "~/static/routes";

definePageMeta({
    layout: "dashboard",
});

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const isLoadingData = ref(false);
const bankAccounts = ref<IPaginationResult<IBankAccount> | null>(null);
const paginationBody = ref<IPaginationBody>({
    page: 1,
    limit: 10,
});

const isCreateSheetOpen = ref(false);
const isUpdateSheetOpen = ref(false);
const updatingBankAccount = ref<IBankAccount | null>(null);

watch(isUpdateSheetOpen, (isUpdateSheetOpen) => {
    if (!isUpdateSheetOpen) {
        updatingBankAccount.value = null;
    }
}, { immediate: true })

const createBankAccountInitialValues: ICreateBankAccount = {
    name: '',
    userId: currentUser.value?.id || '',
}

const loadBankAccounts = async () => {
    if (!currentUser.value) return;

    isLoadingData.value = true;
    try {
        const response = await getBankAccounts({
            userId: currentUser.value.id,
            pagination: paginationBody.value,
            options: {
                toastOptions: undefined,
            },
        });

        if (response.data) {
            bankAccounts.value = response.data;
        }
    } finally {
        isLoadingData.value = false;
    }
};

const { openDialog } = useAlertDialog();

const handleDelete = async (bankAccount: IBankAccount) => {
    if (!bankAccount) return;

    openDialog({
        title: "Deletar Conta Bancária",
        message: `Tem certeza que deseja deletar a conta "${bankAccount?.name}"?`,
        confirm: {
            label: "Deletar",
            action: async () => {
                if (!bankAccount?.id) return;
                const response = await deleteBankAccount({
                    id: bankAccount.id,
                    options: {
                        toastOptions: {
                            loading: {
                                message: "Deletando conta bancária...",
                            },
                            success: {
                                message: "Conta bancária deletada com sucesso!",
                            },
                            error: true,
                        },
                    },
                });
                if (response.data) {
                    loadBankAccounts();
                }
            },
        },
    });

};

const handleEdit = (bankAccount: IBankAccount) => {
    updatingBankAccount.value = bankAccount;
    isUpdateSheetOpen.value = true;
};

const handleCreate = () => {
    isCreateSheetOpen.value = true;
};

const handleUpdateSuccess = () => {
    updatingBankAccount.value = null;
    isUpdateSheetOpen.value = false;
    loadBankAccounts();
};
const handleCreateSuccess = () => {
    isCreateSheetOpen.value = false;
    loadBankAccounts();
};

const router = useRouter();
const handleView = (bankAccount: IBankAccount) => {
    router.push(ROUTE.bankAccountId.path(bankAccount.id));
};

const columns: ColumnDef<IBankAccount>[] = [
    {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => {
            const name = row.getValue("name") as string;
            return h(
                FancyLink,
                { class: "flex items-center gap-2", to: ROUTE.bankAccountId.path(row.original.id) },
                [
                    h(WalletIcon, { class: "h-4 w-4 text-muted-foreground" }),
                    h("span", { class: "font-medium" }, name),
                ]
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Data de Criação",
        cell: ({ row }) => {
            const date = row.original.createdAt;
            return h("span", { class: "text-sm text-muted-foreground" }, formatDate(date));
        },
    },
    {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
            const bankAccount = row.original;
            return h(
                "div",
                { class: "flex items-center gap-2" },
                [
                    h(
                        resolveComponent("UiButton"),
                        {
                            variant: "ghost",
                            size: "icon",
                            onClick: () => handleView(bankAccount),
                        },
                        () => h(EyeIcon, { class: "h-4 w-4" })
                    ),
                    h(
                        resolveComponent("UiButton"),
                        {
                            variant: "ghost",
                            size: "icon",
                            onClick: () => handleEdit(bankAccount),
                        },
                        () => h(EditIcon, { class: "h-4 w-4" })
                    ),
                    h(
                        resolveComponent("UiButton"),
                        {
                            variant: "ghost",
                            size: "icon",
                            onClick: () => handleDelete(bankAccount),
                        },
                        () => h(TrashIcon, { class: "h-4 w-4 text-destructive" })
                    ),
                ]
            );
        },
    },
];

watch(
    () => paginationBody.value.page,
    () => {
        loadBankAccounts();
    }
);

onMounted(() => {
    loadBankAccounts();
});
</script>

<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
                <p class="text-muted-foreground">Gerencie suas contas bancárias</p>
            </div>
            <UiButton @click="handleCreate">
                <PlusIcon class="h-4 w-4 mr-2" />
                Nova Conta
            </UiButton>
        </div>
        <Table :columns="columns" :pagination-body="paginationBody" :pagination-result="bankAccounts"
            :is-loading="isLoadingData" />


        <BankAccountsCreateSheet v-model:is-open="isCreateSheetOpen" :initial-values="createBankAccountInitialValues"
            :on-success="handleCreateSuccess" :on-cancel="() => {
                isCreateSheetOpen = false
            }" />
        <BankAccountsEditSheet v-model:is-open="isUpdateSheetOpen" :initial-values="updatingBankAccount"
            :on-success="handleUpdateSuccess" :on-cancel="() => {
                updatingBankAccount = null
                isUpdateSheetOpen = false
            }" />
    </div>
</template>

<style lang="scss" scoped></style>
