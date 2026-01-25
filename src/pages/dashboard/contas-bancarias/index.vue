<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { WalletIcon, PlusIcon, EditIcon, TrashIcon, MoreHorizontalIcon } from "lucide-vue-next";
import type { IBankAccount, ICreateBankAccount } from "~/@schemas/models/bank-account";
import type { IPaginationBody, IPaginationResult } from "~/@types/pagination";
import { getBankAccounts } from "~/services/api/bank-accounts/get-bank-accounts";
import { deleteBankAccount } from "~/services/api/bank-accounts/delete-bank-account";
import { formatDate } from "~/helpers/formatDate";
import BankAccountForm from "~/components/BankAccounts/BankAccountForm.vue";

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
const updatingBankAccount = ref<IBankAccount | null>(null);

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

const handleDelete = async (bankAccount: IBankAccount) => {
    const confirmed = confirm(
        `Tem certeza que deseja deletar a conta "${bankAccount.name}"?`
    );
    if (!confirmed) return;

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

    if (response.data !== null) {
        loadBankAccounts();
    }
};

const handleEdit = (bankAccount: IBankAccount) => {
    updatingBankAccount.value = bankAccount;
};

const handleCreate = () => {
    updatingBankAccount.value = null;
};

const handleUpdateSuccess = () => {
    updatingBankAccount.value = null;
    loadBankAccounts();
};
const handleCreateSuccess = () => {
    isCreateSheetOpen.value = false;
    loadBankAccounts();
};

const columns: ColumnDef<IBankAccount>[] = [
    {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => {
            const name = row.getValue("name") as string;
            return h(
                "div",
                { class: "flex items-center gap-2" },
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

        <UiSheet v-model:open="isCreateSheetOpen">
            <UiSheetContent class="sm:max-w-xl overflow-y-auto">
                <UiSheetHeader>
                    <UiSheetTitle>
                        Nova Conta
                    </UiSheetTitle>
                    <UiSheetDescription>
                        Adicione uma nova conta bancária
                    </UiSheetDescription>
                </UiSheetHeader>

                <BankAccountForm :initial-values="createBankAccountInitialValues" @success="handleCreateSuccess"
                    @cancel="isCreateSheetOpen = false" :is-edit-mode="false" />
            </UiSheetContent>
        </UiSheet>
        <UiSheet v-if="updatingBankAccount" :open="true">
            <UiSheetContent class="sm:max-w-xl overflow-y-auto">
                <UiSheetHeader>
                    <UiSheetTitle>
                        Editar Conta
                    </UiSheetTitle>
                    <UiSheetDescription>
                        "Edite as informações da conta bancária"
                    </UiSheetDescription>
                </UiSheetHeader>
                <BankAccountForm v-if="updatingBankAccount" :initial-values="updatingBankAccount"
                    @success="handleUpdateSuccess" @cancel="updatingBankAccount = null" :is-edit-mode="true" />
            </UiSheetContent>
        </UiSheet>
    </div>
</template>

<style lang="scss" scoped></style>
