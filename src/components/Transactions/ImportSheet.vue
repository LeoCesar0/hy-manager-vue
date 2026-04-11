<script setup lang="ts">
import {
  UploadIcon,
  FileSpreadsheetIcon,
  ArrowLeftIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  AlertCircleIcon,
  BanIcon,
} from "lucide-vue-next";
import type { IBankStatementRow } from "~/services/csv-import/@types";
import { parseBankStatement } from "~/services/csv-import/parse-bank-statement";
import { importTransactions } from "~/services/api/transactions/import-transactions";
import { formatCurrency } from "~/helpers/formatCurrency";
import { roundCurrency } from "~/helpers/roundCurrency";
import { BANK_ACCOUNT_COMPANY_LABELS } from "~/@schemas/models/bank-account";

type IProps = {
  isOpen: boolean;
  bankAccountId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const props = defineProps<IProps>();

const emit = defineEmits<{
  "update:isOpen": [value: boolean];
}>();

const dashboardStore = useDashboardStore();
const { currentBankAccount } = storeToRefs(dashboardStore);

// The selected company determines which parser runs — no manual selector.
// "other" accounts are feature-gated below with a disabled state that tells
// the user they need to add transactions manually. Silently falling through
// to a default parser here would produce wrong imports.
const selectedFormat = computed(() => currentBankAccount.value?.company ?? "other");
const isUnsupportedBank = computed(() => selectedFormat.value === "other");

const step = ref<"upload" | "confirm">("upload");
const parsedRows = ref<IBankStatementRow[]>([]);
const parseError = ref<string | null>(null);
const isImporting = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileCount = ref(0);

const summary = computed(() => {
  const rows = parsedRows.value;
  if (rows.length === 0) return null;

  const deposits = rows.filter((r) => r.type === "deposit");
  const expenses = rows.filter((r) => r.type === "expense");
  const counterpartyNames = new Set(
    rows.map((r) => r.counterpartyName).filter(Boolean)
  );

  return {
    total: rows.length,
    deposits: {
      count: deposits.length,
      sum: roundCurrency({ value: deposits.reduce((acc, r) => acc + r.amount, 0) }),
    },
    expenses: {
      count: expenses.length,
      sum: roundCurrency({ value: expenses.reduce((acc, r) => acc + r.amount, 0) }),
    },
    counterparties: counterpartyNames.size,
  };
});

const readFileAsText = (props: { file: File }): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error(`Falha ao ler o arquivo "${props.file.name}".`));
    reader.readAsText(props.file, "UTF-8");
  });
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) return;

  parseError.value = null;
  parsedRows.value = [];
  selectedFileCount.value = files.length;

  const errors: string[] = [];
  const allRows: IBankStatementRow[] = [];

  const fileArray = Array.from(files);
  const contents = await Promise.all(
    fileArray.map((file) => readFileAsText({ file }).catch(() => {
      errors.push(`Falha ao ler "${file.name}".`);
      return null;
    }))
  );

  for (let i = 0; i < fileArray.length; i++) {
    const csvText = contents[i];
    if (!csvText) continue;

    try {
      const rows = parseBankStatement({
        formatKey: selectedFormat.value,
        csvText,
      });
      allRows.push(...rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido.";
      errors.push(`${fileArray[i]!.name}: ${message}`);
    }
  }

  const seen = new Set<string>();
  const deduplicated: IBankStatementRow[] = [];
  for (const row of allRows) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      deduplicated.push(row);
    }
  }

  parsedRows.value = deduplicated;

  if (errors.length > 0) {
    parseError.value = errors.join("\n");
  }
};

const handleContinue = () => {
  step.value = "confirm";
};

const handleBack = () => {
  step.value = "upload";
};

const handleImport = async () => {
  if (parsedRows.value.length === 0) return;

  const result = await importTransactions({
    rows: parsedRows.value,
    userId: props.userId,
    bankAccountId: props.bankAccountId,
    options: {
      loadingRefs: [isImporting],
    },
  });

  if (result.data) {
    resetState();
    emit("update:isOpen", false);
    props.onSuccess?.();
  }
};

const resetState = () => {
  step.value = "upload";
  parsedRows.value = [];
  parseError.value = null;
  selectedFileCount.value = 0;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const handleClose = (value: boolean) => {
  if (!value) {
    resetState();
    props.onCancel?.();
  }
  emit("update:isOpen", value);
};
</script>

<template>
  <UiSheet :open="isOpen" @update:open="handleClose">
    <UiSheetContent class="overflow-y-auto">
      <UiSheetHeader>
        <UiSheetTitle>Importar Extrato</UiSheetTitle>
        <UiSheetDescription>
          Importe transações a partir do extrato CSV do seu banco
        </UiSheetDescription>
      </UiSheetHeader>

      <UiSheetBody>
        <!-- Feature-gated state for accounts whose bank doesn't have a parser.
             Showing a clear disabled state is better than silently falling
             through to a default parser — that produced wrong imports before
             the company field existed. -->
        <div v-if="isUnsupportedBank" class="space-y-4">
          <div class="flex items-start gap-3 p-4 rounded-md bg-muted/50 text-sm">
            <BanIcon class="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div class="space-y-1">
              <p class="font-medium">Upload de extrato não disponível</p>
              <p class="text-muted-foreground">
                A conta selecionada não tem um banco compatível com importação
                automática. Adicione as transações manualmente ou edite a conta
                para selecionar um banco suportado.
              </p>
            </div>
          </div>
        </div>

        <!-- Step: Upload -->
        <div v-else-if="step === 'upload'" class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium">Formato do banco</label>
            <div class="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
              <FileSpreadsheetIcon class="w-4 h-4 text-muted-foreground" />
              <span class="font-medium">{{ BANK_ACCOUNT_COMPANY_LABELS[selectedFormat] }}</span>
              <span class="text-xs text-muted-foreground ml-auto">detectado da conta</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Arquivo CSV</label>
            <div
              class="flex items-center justify-center w-full"
            >
              <label
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/10 transition-colors"
              >
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon class="w-8 h-8 mb-2 text-muted-foreground" />
                  <p class="text-sm text-muted-foreground">
                    Clique para selecionar um ou mais arquivos CSV
                  </p>
                  <p
                    v-if="selectedFileCount > 0"
                    class="text-xs text-muted-foreground mt-1"
                  >
                    {{ selectedFileCount }} {{ selectedFileCount === 1 ? 'arquivo selecionado' : 'arquivos selecionados' }}
                  </p>
                </div>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".csv"
                  multiple
                  class="hidden"
                  @change="handleFileChange"
                />
              </label>
            </div>
          </div>

          <!-- Parse Error -->
          <div
            v-if="parseError"
            class="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircleIcon class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ parseError }}</span>
          </div>

          <!-- Preview Summary -->
          <div v-if="summary" class="space-y-3">
            <h4 class="text-sm font-medium">Resumo do extrato</h4>

            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                <FileSpreadsheetIcon class="w-4 h-4 text-muted-foreground" />
                <div>
                  <p class="text-xs text-muted-foreground">Total</p>
                  <p class="text-sm font-medium">
                    {{ summary.total }} transações
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                <UsersIcon class="w-4 h-4 text-muted-foreground" />
                <div>
                  <p class="text-xs text-muted-foreground">Identificadores</p>
                  <p class="text-sm font-medium">
                    {{ summary.counterparties }} encontrados
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 p-3 rounded-md bg-deposit/10">
                <TrendingUpIcon class="w-4 h-4 text-deposit" />
                <div>
                  <p class="text-xs text-muted-foreground">Receitas</p>
                  <p class="text-sm font-medium text-deposit">
                    {{ summary.deposits.count }}x —
                    {{ formatCurrency({ amount: summary.deposits.sum }) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 p-3 rounded-md bg-expense/10">
                <TrendingDownIcon class="w-4 h-4 text-expense" />
                <div>
                  <p class="text-xs text-muted-foreground">Despesas</p>
                  <p class="text-sm font-medium text-expense">
                    {{ summary.expenses.count }}x —
                    {{ formatCurrency({ amount: summary.expenses.sum }) }}
                  </p>
                </div>
              </div>
            </div>

            <UiButton class="w-full" @click="handleContinue">
              Continuar
            </UiButton>
          </div>
        </div>

        <!-- Step: Confirm -->
        <div v-if="!isUnsupportedBank && step === 'confirm'" class="space-y-6">
          <div v-if="summary" class="space-y-4">
            <div class="p-4 rounded-md bg-muted/50 space-y-2">
              <p class="text-sm">
                <span class="font-medium">{{ summary.total }}</span> transações
                serão importadas para a conta selecionada.
              </p>
              <p class="text-sm text-muted-foreground">
                Transações com identificadores já existentes serão
                automaticamente ignoradas.
              </p>
              <p class="text-sm text-muted-foreground">
                Identificadores serão criados automaticamente caso não existam.
              </p>
            </div>

            <div class="flex gap-2">
              <UiButton
                variant="outline"
                class="flex-1"
                :disabled="isImporting"
                @click="handleBack"
              >
                <ArrowLeftIcon class="w-4 h-4 mr-2" />
                Voltar
              </UiButton>
              <UiButton
                class="flex-1"
                :disabled="isImporting"
                @click="handleImport"
              >
                <UploadIcon class="w-4 h-4 mr-2" />
                {{ isImporting ? "Importando..." : "Importar" }}
              </UiButton>
            </div>
          </div>
        </div>
      </UiSheetBody>
    </UiSheetContent>
  </UiSheet>
</template>
