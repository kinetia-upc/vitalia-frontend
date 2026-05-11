<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section class="dashboard-view patient-dashboard">
    <div class="patient-title">
      <h1>{{ t('patient.greeting') }}</h1>
      <p>{{ t('patient.summary') }}</p>
    </div>

    <div class="patient-grid">
      <article class="panel next-appointment">
        <span class="pill-label">{{ t('patient.nextAppointment') }}</span>
        <h2>Dr. Alistair Vance</h2>
        <p>Advanced Cardiology Consultation</p>
        <div class="appointment-meta">
          <div>
            <small>{{ t('patient.date') }}</small>
            <strong>April 24, 2026</strong>
          </div>
          <div>
            <small>{{ t('patient.time') }}</small>
            <strong>09:30 AM (GMT)</strong>
          </div>
        </div>
        <div class="appointment-actions">
          <button type="button" class="primary-action">{{ t('patient.viewDetails') }}</button>
          <button type="button" class="ghost-action">{{ t('patient.allAppointments') }}</button>
        </div>
      </article>

      <div class="quick-actions">
        <button type="button" class="quick-card">
          <span class="quick-icon">+</span>
          <strong>{{ t('patient.bookAppointment') }}</strong>
          <small>{{ t('patient.bookCaption') }}</small>
        </button>
        <button type="button" class="quick-card amber">
          <span class="quick-icon">ID</span>
          <strong>{{ t('patient.viewRecords') }}</strong>
          <small>{{ t('patient.recordsCaption') }}</small>
        </button>
      </div>

      <article class="panel interactions-panel">
        <div class="panel-heading">
          <h2>{{ t('patient.recentInteractions') }}</h2>
          <button type="button">{{ t('patient.viewAllHistory') }}</button>
        </div>
        <div class="interaction-list">
          <div class="interaction-item">
            <span class="interaction-icon">Rx</span>
            <div>
              <strong>{{ t('patient.prescriptionUpdated') }}</strong>
              <p>Lipitor 20mg - Renewal approved</p>
            </div>
            <small>Yesterday</small>
          </div>
          <div class="interaction-item">
            <span class="interaction-icon teal">Lab</span>
            <div>
              <strong>{{ t('patient.labReady') }}</strong>
              <p>Annual Comprehensive Metabolic Panel</p>
            </div>
            <small>3 Days ago</small>
          </div>
          <div class="interaction-item">
            <span class="interaction-icon amber">Dr</span>
            <div>
              <strong>{{ t('patient.physicianNote') }}</strong>
              <p>Follow-up comments from Dr. Sarah Jenkins</p>
            </div>
            <small>Apr 13, 2026</small>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
