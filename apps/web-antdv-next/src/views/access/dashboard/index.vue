<script lang="ts" setup>
import type { AccessDashboardStats } from '#/api/access';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Col, Empty, Row, Spin, Statistic } from 'ant-design-vue';

import { getAccessDashboardStatsApi } from '#/api/access';

const loading = ref(false);
const stats = ref<AccessDashboardStats | null>(null);

async function loadStats(): Promise<void> {
  loading.value = true;
  try {
    stats.value = await getAccessDashboardStatsApi();
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    stats.value = null;
  } finally {
    loading.value = false;
  }
}

function entries(
  map: Record<string, number> | undefined,
): Array<[string, number]> {
  if (!map) {
    return [];
  }
  return Object.entries(map).toSorted(([, a], [, b]) => b - a);
}

const GRADE_LABEL: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium (VIP)',
  elite: 'Elite (SVIP)',
};

onMounted(() => {
  void loadStats();
});
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <Empty v-if="!stats" description="暂无数据" />
      <template v-else>
        <Row :gutter="16">
          <Col :span="8">
            <Card>
              <Statistic
                title="生效订阅"
                :value="stats.active_subscription_count"
              />
            </Card>
          </Col>
          <Col :span="8">
            <Card>
              <Statistic
                title="7 天内到期"
                :value="stats.expiring_in_7_days"
                :value-style="{ color: '#fa8c16' }"
              />
            </Card>
          </Col>
          <Col :span="8">
            <Card>
              <Statistic
                title="30 天内到期"
                :value="stats.expiring_in_30_days"
                :value-style="{ color: '#1677ff' }"
              />
            </Card>
          </Col>
        </Row>

        <Row :gutter="16" style="margin-top: 16px">
          <Col :span="8">
            <Card title="Pack 分布" size="small">
              <Empty
                v-if="entries(stats.pack_distribution).length === 0"
                description="暂无数据"
              />
              <div
                v-for="[code, count] in entries(stats.pack_distribution)"
                :key="code"
                class="flex items-center justify-between py-2"
              >
                <span class="text-sm">{{ code }}</span>
                <span class="text-base font-bold">{{ count }}</span>
              </div>
            </Card>
          </Col>
          <Col :span="8">
            <Card title="档级分布" size="small">
              <Empty
                v-if="entries(stats.grade_distribution).length === 0"
                description="暂无数据"
              />
              <div
                v-for="[grade, count] in entries(stats.grade_distribution)"
                :key="grade"
                class="flex items-center justify-between py-2"
              >
                <span class="text-sm">{{ GRADE_LABEL[grade] || grade }}</span>
                <span class="text-base font-bold">{{ count }}</span>
              </div>
            </Card>
          </Col>
          <Col :span="8">
            <Card title="领域分布" size="small">
              <Empty
                v-if="entries(stats.domain_distribution).length === 0"
                description="暂无数据"
              />
              <div
                v-for="[domain, count] in entries(stats.domain_distribution)"
                :key="domain"
                class="flex items-center justify-between py-2"
              >
                <span class="text-sm">{{ domain }}</span>
                <span class="text-base font-bold">{{ count }}</span>
              </div>
            </Card>
          </Col>
        </Row>
      </template>
    </Spin>
  </Page>
</template>
