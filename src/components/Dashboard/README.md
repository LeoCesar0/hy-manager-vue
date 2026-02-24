# Dashboard Components - Componentes Reutilizáveis

Este documento descreve os componentes reutilizáveis criados para páginas do dashboard, seguindo os princípios DRY e KISS.

## Componentes Criados

### 1. DashboardSection

Componente principal para estruturar páginas do dashboard.

**Props:**
- `title` (string, required): Título da seção
- `subtitle` (string, optional): Subtítulo descritivo
- `showBackButton` (boolean, default: false): Exibe botão de voltar
- `onBack` (function, optional): Callback ao clicar no botão voltar
- `loading` (boolean, default: false): Estado de carregamento

**Slots:**
- `actions`: Botões de ação (no header, lado direito)
- `detail-actions`: Botões de ação para páginas de detalhes (quando showBackButton=true)
- `filters`: Área para filtros (abaixo do header)
- `default`: Conteúdo principal

**Exemplo de uso:**
```vue
<DashboardSection 
  title="Categorias" 
  subtitle="Gerencie suas categorias"
  :loading="isLoadingData"
>
  <template #actions>
    <UiButton @click="handleCreate">Nova Categoria</UiButton>
  </template>
  
  <template #filters>
    <SearchInput v-model="searchQuery" />
  </template>
  
  <!-- Conteúdo aqui -->
</DashboardSection>
```

---

### 2. SearchInput

Input de busca com ícone integrado.

**Props:**
- `modelValue` (string, required): Valor do input (v-model)
- `placeholder` (string, default: "Buscar..."): Placeholder do input
- `maxWidth` (string, default: "max-w-sm"): Largura máxima

**Emits:**
- `update:modelValue`: Atualiza o valor do input

**Exemplo de uso:**
```vue
<SearchInput 
  v-model="searchQuery" 
  placeholder="Buscar categorias..." 
/>
```

---

### 3. EmptyState

Estado vazio com mensagem e ação opcional.

**Props:**
- `title` (string, required): Título do estado vazio
- `description` (string, required): Descrição
- `showCreateButton` (boolean, default: true): Exibe botão de criar
- `createButtonLabel` (string, default: "Criar"): Label do botão
- `onCreate` (function, optional): Callback ao clicar no botão

**Slots:**
- `default`: Conteúdo customizado (substitui o botão padrão)

**Exemplo de uso:**
```vue
<EmptyState 
  title="Nenhuma categoria encontrada"
  description="Crie sua primeira categoria"
  create-button-label="Nova Categoria"
  :on-create="handleCreate"
/>
```

---

### 4. DetailCard

Card para páginas de detalhes com estado de loading e not found.

**Props:**
- `loading` (boolean, default: false): Estado de carregamento
- `notFound` (boolean, default: false): Item não encontrado
- `notFoundTitle` (string, default: "Item não encontrado"): Título do not found
- `notFoundDescription` (string): Descrição do not found

**Slots:**
- `header`: Cabeçalho do card (ex: avatar + nome)
- `content`: Conteúdo principal (campos de dados)
- `not-found-action`: Ação quando item não encontrado

**Exemplo de uso:**
```vue
<DetailCard 
  :not-found="!category"
  not-found-title="Categoria não encontrada"
>
  <template #header>
    <div class="flex items-center gap-4">
      <!-- Avatar/ícone + nome -->
    </div>
  </template>
  
  <template #content>
    <DetailField label="Nome" :value="category?.name" />
  </template>
  
  <template #not-found-action>
    <UiButton @click="goBack">Voltar</UiButton>
  </template>
</DetailCard>
```

---

### 5. DetailField

Campo individual para exibir dados em páginas de detalhes.

**Props:**
- `label` (string, required): Label do campo
- `value` (string | number | null, optional): Valor do campo
- `emptyText` (string, default: "—"): Texto quando valor vazio

**Slots:**
- `default`: Conteúdo customizado (substitui o valor)

**Exemplo de uso:**
```vue
<!-- Uso simples -->
<DetailField label="Nome" :value="category?.name" />

<!-- Uso com slot customizado -->
<DetailField label="Cor">
  <div class="flex items-center gap-2">
    <div class="h-6 w-6 rounded-full" :style="{ backgroundColor: color }" />
    <span>{{ color }}</span>
  </div>
</DetailField>
```

---

### 6. ActionButtons

Conjunto de botões de ação (visualizar, editar, deletar).

**Props:**
- `showView` (boolean, default: false): Exibe botão visualizar
- `showEdit` (boolean, default: true): Exibe botão editar
- `showDelete` (boolean, default: true): Exibe botão deletar
- `editVariant` ("outline" | "ghost", default: "outline"): Variante do botão editar
- `deleteVariant` ("destructive" | "ghost", default: "destructive"): Variante do botão deletar
- `onView` (function, optional): Callback ao visualizar
- `onEdit` (function, optional): Callback ao editar
- `onDelete` (function, optional): Callback ao deletar

**Exemplo de uso:**
```vue
<!-- Para tabelas -->
<ActionButtons 
  :show-view="true"
  edit-variant="ghost"
  delete-variant="ghost"
  :on-view="() => handleView(item)"
  :on-edit="() => handleEdit(item)"
  :on-delete="() => handleDelete(item)"
/>

<!-- Para páginas de detalhes -->
<ActionButtons 
  :show-view="false"
  :on-edit="handleEdit"
  :on-delete="handleDelete"
/>
```

---

### 7. CardGrid

Grid responsivo para cards.

**Props:**
- `minWidth` (string, default: "220px"): Largura mínima dos cards
- `gap` (string, default: "1rem"): Espaçamento entre cards

**Exemplo de uso:**
```vue
<CardGrid>
  <CategoryCard v-for="category in categories" :key="category.id" :category="category" />
</CardGrid>
```

---

## Padrões de Uso

### Página de Listagem (Index)

```vue
<DashboardSection 
  title="Categorias" 
  subtitle="Gerencie suas categorias"
  :loading="isLoadingData"
>
  <template #actions>
    <UiButton @click="handleCreate">Nova Categoria</UiButton>
  </template>
  
  <template #filters>
    <SearchInput v-model="searchQuery" placeholder="Buscar..." />
  </template>
  
  <EmptyState 
    v-if="items.length === 0"
    title="Nenhum item encontrado"
    :on-create="handleCreate"
  />
  
  <CardGrid v-else>
    <ItemCard v-for="item in items" :key="item.id" :item="item" />
  </CardGrid>
</DashboardSection>
```

### Página de Detalhes ([id])

```vue
<DashboardSection 
  title="Detalhes" 
  subtitle="Visualize e edite"
  :show-back-button="true"
  :on-back="handleGoBack"
  :loading="isLoadingData"
>
  <template #detail-actions>
    <ActionButtons 
      :show-view="false"
      :on-edit="handleEdit"
      :on-delete="handleDelete"
    />
  </template>

  <DetailCard :not-found="!item">
    <template #header>
      <!-- Avatar/ícone + nome -->
    </template>
    
    <template #content>
      <div class="grid gap-4 md:grid-cols-2">
        <DetailField label="Nome" :value="item?.name" />
        <DetailField label="Data" :value="formatDate(item?.date)" />
      </div>
    </template>
  </DetailCard>
</DashboardSection>
```

---

## Benefícios

1. **DRY (Don't Repeat Yourself)**: Código reutilizado em múltiplas páginas
2. **KISS (Keep It Simple)**: Componentes simples e focados
3. **Consistência**: Interface uniforme em todas as páginas
4. **Manutenibilidade**: Alterações em um único lugar
5. **Flexibilidade**: Slots permitem customização quando necessário
6. **Tipagem**: TypeScript para segurança de tipos
