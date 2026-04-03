import Head from "next/head";
import { FormEvent, useEffect, useState } from "react";

import { ProfileForm } from "@/components/ProfileForm";
import { RiskMeter } from "@/components/RiskMeter";
import { ScenarioSimulator, ScenarioState } from "@/components/ScenarioSimulator";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AllocationPieChart } from "@/charts/AllocationPieChart";
import { WealthProjectionChart } from "@/charts/WealthProjectionChart";
import { api } from "@/lib/api";
import { RecommendationResponse, SimulationResponse, UserCreatePayload } from "@/types";

const initialForm: UserCreatePayload = {
  age: 30,
  monthly_income: 120000,
  monthly_expenses: 55000,
  current_savings: 450000,
  goal_name: "Retirement corpus",
  goal_amount: 2000000,
  goal_years: 10,
  risk_questionnaire: {
    market_reaction: 4,
    investment_style: 4,
    liquidity_preference: 3,
    goal_priority: 4,
    volatility_comfort: 4,
  },
};

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [form, setForm] = useState<UserCreatePayload>(initialForm);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [scenario, setScenario] = useState<ScenarioState>({
    sipAmount: 15000,
    annualReturnRate: 11,
    years: 10,
    monthlyIncomeChange: 0,
    monthlyExpensesChange: 0,
    oneTimeExpense: 0,
    lifeEvent: "none" as const,
  });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const savedUserId = window.localStorage.getItem("investment-user-id");
    const dark = savedTheme === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);

    if (savedUserId) {
      setUserId(savedUserId);
      api
        .getRecommendation(savedUserId)
        .then((response) => {
          setRecommendation(response);
          setScenario((current) => ({
            ...current,
            sipAmount: response.recommended_sip,
            annualReturnRate: response.expected_annual_return,
            years: response.user.goal_years,
          }));
        })
        .catch(() => {
          window.localStorage.removeItem("investment-user-id");
        });
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    window.localStorage.setItem("theme", nextTheme ? "dark" : "light");
  };

  const updateField = (field: keyof UserCreatePayload, value: string | number) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateRiskField = (field: keyof UserCreatePayload["risk_questionnaire"], value: number) => {
    setForm((current) => ({
      ...current,
      risk_questionnaire: {
        ...current.risk_questionnaire,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSimulation(null);

    try {
      const profile = await api.createUser(form);
      const response = await api.getRecommendation(profile.id);
      setUserId(profile.id);
      setRecommendation(response);
      setScenario({
        sipAmount: response.recommended_sip,
        annualReturnRate: response.expected_annual_return,
        years: response.user.goal_years,
        monthlyIncomeChange: 0,
        monthlyExpensesChange: 0,
        oneTimeExpense: 0,
        lifeEvent: "none",
      });
      window.localStorage.setItem("investment-user-id", profile.id);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!userId) {
      return;
    }
    setSimulationLoading(true);
    setError("");
    try {
      const response = await api.simulate({
        user_id: userId,
        sip_amount: scenario.sipAmount,
        annual_return_rate: scenario.annualReturnRate,
        years: scenario.years,
        monthly_income_change: scenario.monthlyIncomeChange,
        monthly_expenses_change: scenario.monthlyExpensesChange,
        one_time_expense: scenario.oneTimeExpense,
        life_event: scenario.lifeEvent,
      });
      setSimulation(response);
    } catch (simulationError) {
      setError(simulationError instanceof Error ? simulationError.message : "Simulation failed.");
    } finally {
      setSimulationLoading(false);
    }
  };

  const activeProjection = simulation?.projection || recommendation?.projection || [];

  const updateScenario = <K extends keyof ScenarioState>(field: K, value: ScenarioState[K]) => {
    setScenario((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <>
      <Head>
        <title>InvestAI Planner</title>
        <meta
          name="description"
          content="AI-powered personalized investment recommender with SIP planning, wealth projection, and scenario simulation."
        />
      </Head>

      <div className="min-h-screen px-4 py-8 text-ink md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="glass-panel rounded-[32px] bg-hero-grid p-8 shadow-glow">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.3em] text-accent">Personalized Investment Recommender</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
                  Build a portfolio plan around your risk profile, cash flow, and life goals.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">
                  InvestAI combines rule-based financial planning with an ML-driven allocator to recommend SIPs, equity-debt mix, and scenario-tested wealth outcomes.
                </p>
              </div>
              <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <SectionCard title="Investor Profile" subtitle="Tell us about your income, savings, goal, and risk appetite.">
              <ProfileForm form={form} loading={loading} onChange={updateField} onRiskChange={updateRiskField} onSubmit={handleSubmit} />
              {error ? <p className="mt-4 text-sm font-medium text-rose-500">{error}</p> : null}
            </SectionCard>

            <SectionCard
              title="Plan Snapshot"
              subtitle="A fintech-style summary of your current recommendation and goal readiness."
            >
              {recommendation ? (
                <div className="space-y-5">
                  <RiskMeter score={recommendation.user.risk_score} bucket={recommendation.risk_bucket} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      label="Recommended SIP"
                      value={`Rs. ${recommendation.recommended_sip.toLocaleString()}`}
                      helper="Monthly investment contribution"
                    />
                    <StatCard
                      label="Expected Return"
                      value={`${recommendation.expected_annual_return}%`}
                      helper="Blended annual return assumption"
                    />
                    <StatCard
                      label="Savings Ratio"
                      value={`${Math.round(recommendation.user.savings_ratio * 100)}%`}
                      helper="Disposable income as a share of salary"
                    />
                    <StatCard
                      label="Disposable Income"
                      value={`Rs. ${recommendation.user.disposable_income.toLocaleString()}`}
                      helper="Available cash flow after expenses"
                    />
                  </div>
                  <p className="rounded-3xl border border-border/60 bg-slate-950/10 p-4 text-sm leading-7 text-muted dark:bg-slate-100/5">
                    {simulation?.explanation || recommendation.explanation}
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border p-8 text-muted">
                  Submit your profile to generate a recommendation, allocation, and wealth projection.
                </div>
              )}
            </SectionCard>
          </div>

          {recommendation ? (
            <>
              <div className="grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
                <SectionCard title="Portfolio Allocation" subtitle="Recommended distribution between growth and stability assets.">
                  <AllocationPieChart
                    equity={simulation?.equity_allocation || recommendation.equity_allocation}
                    debt={simulation?.debt_allocation || recommendation.debt_allocation}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-border/60 p-4">
                      <p className="text-sm text-muted">Equity allocation</p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {(simulation?.equity_allocation || recommendation.equity_allocation).toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border/60 p-4">
                      <p className="text-sm text-muted">Debt allocation</p>
                      <p className="mt-2 text-2xl font-semibold text-ink">
                        {(simulation?.debt_allocation || recommendation.debt_allocation).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Wealth Projection" subtitle="Interactive future value curve based on SIP compounding and your scenario assumptions.">
                  <WealthProjectionChart data={activeProjection} />
                </SectionCard>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
                <SectionCard
                  title="Goal-Based Investment Planner"
                  subtitle="The planner computes the monthly SIP needed for your target and the return hurdle that keeps you on track."
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                      label="Goal"
                      value={`Rs. ${recommendation.goal_plan.target_amount.toLocaleString()}`}
                      helper={`${recommendation.user.goal_name} target`}
                    />
                    <StatCard
                      label="Goal SIP"
                      value={`Rs. ${recommendation.goal_plan.required_monthly_sip.toLocaleString()}`}
                      helper={`${recommendation.goal_plan.years} year requirement`}
                    />
                    <StatCard
                      label="Required Return"
                      value={`${recommendation.goal_plan.required_annual_return}%`}
                      helper="Annualized return needed at the recommended SIP"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Behavioral Analysis"
                  subtitle="Mock spending categories flag discretionary drag so you can improve SIP capacity without changing your goals."
                >
                  <div className="grid gap-3">
                    {recommendation.behavioral_analysis.categories.map((category) => (
                      <div key={category.category} className="rounded-3xl border border-border/60 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-ink">{category.category}</p>
                          <p className="text-sm text-muted">Rs. {category.monthly_amount.toLocaleString()}</p>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-300/20">
                          <div className="h-2 rounded-full bg-accent" style={{ width: `${category.share * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-sm leading-7 text-muted">{recommendation.behavioral_analysis.insight}</p>
                    <p className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-medium text-ink">
                      {recommendation.behavioral_analysis.suggestion}
                    </p>
                  </div>
                </SectionCard>
              </div>

              <SectionCard
                title="Scenario & Life Event Simulation"
                subtitle="Stress-test the plan for return changes, cash flow shocks, or major life events like job loss and marriage."
              >
                <ScenarioSimulator
                  scenario={scenario}
                  loading={simulationLoading}
                  onChange={updateScenario}
                  onRun={runSimulation}
                />
                {simulation ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <StatCard label="Scenario" value={simulation.scenario_name} helper="Current simulation lens" />
                    <StatCard label="Adjusted SIP" value={`Rs. ${simulation.adjusted_sip.toLocaleString()}`} helper="Scenario-ready SIP" />
                    <StatCard
                      label="Expected Return"
                      value={`${simulation.expected_annual_return}%`}
                      helper="Projection return for this scenario"
                    />
                  </div>
                ) : null}
              </SectionCard>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
