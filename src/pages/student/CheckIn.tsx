import { Check, Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../auth/AuthProvider";

const MOOD_LABELS = ["", "Very low", "Low", "Steady", "Good", "Very good"];

const MOOD_DESCRIPTIONS = [
  "",
  "Today feels especially heavy.",
  "Things feel a little difficult right now.",
  "You feel fairly balanced.",
  "You're feeling positive and okay.",
  "You're feeling especially well today.",
];

export default function CheckIn() {
  const { profile } = useAuth();

  const [mood, setMood] = useState("3");
  const [stressLevel, setStressLevel] = useState("2");
  const [anxietyLevel, setAnxietyLevel] = useState("2");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!profile) {
      setStatus(
        "Your account must be linked to a student record before you can save a check-in.",
      );
      return;
    }

    setSaving(true);
    setSaved(false);
    setStatus("Saving your check-in...");

    const { error } = await supabase.from("check_ins").insert({
      id: crypto.randomUUID(),
      student_id: profile.id,
      mood: Number(mood),
      stress_level: Number(stressLevel),
      anxiety_level: Number(anxietyLevel),
      note,
      status: "completed",
      created_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setStatus("We couldn't save this check-in just now. Please try again.");
      return;
    }

    setSaved(true);
    setStatus("Check-in saved. Thank you for taking this moment for yourself.");
    setNote("");
  }

  const moodNumber = Number(mood);
  const moodText = MOOD_LABELS[moodNumber];
  const moodDescription = MOOD_DESCRIPTIONS[moodNumber];

  return (
    <main className="page">
      <p className="eyebrow">Daily wellbeing practice</p>

      <h1>How are you, really?</h1>

      <p className="lead">
        There's nothing to get right here. Just notice what is present and let
        yourself be honest.
      </p>

      <section
        className="checkin-layout"
        style={{ marginTop: 30 }}
        aria-label="Daily wellbeing check-in"
      >
        <form className="surface form-card" onSubmit={handleSubmit}>
          <div style={{ marginBottom: 28 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              A moment for you
            </p>

            <h2 style={{ marginBottom: 8 }}>Today's check-in</h2>

            <p className="lead" style={{ fontSize: 15 }}>
              Take a breath and answer based on how you feel right now.
            </p>
          </div>

          <WellbeingScale
            label="Overall mood"
            value={mood}
            onChange={(value) => {
              setMood(value);
              setSaved(false);
            }}
          />

          <WellbeingScale
            label="Stress level"
            value={stressLevel}
            onChange={(value) => {
              setStressLevel(value);
              setSaved(false);
            }}
          />

          <WellbeingScale
            label="Anxiety level"
            value={anxietyLevel}
            onChange={(value) => {
              setAnxietyLevel(value);
              setSaved(false);
            }}
          />

          <div style={{ marginTop: 28 }}>
            <label className="form-label" htmlFor="note">
              Anything you'd like to note?{" "}
              <span
                style={{
                  color: "#8c9a94",
                  fontWeight: 400,
                }}
              >
                (optional)
              </span>
            </label>

            <textarea
              id="note"
              value={note}
              maxLength={500}
              onChange={(event) => {
                setNote(event.target.value);
                setSaved(false);
              }}
              placeholder="A thought, a feeling, or something that happened today..."
              aria-describedby="note-count"
            />

            <div
              id="note-count"
              style={{
                textAlign: "right",
                marginTop: 6,
                color: "#8c9a94",
                fontSize: 12,
              }}
            >
              {note.length}/500
            </div>
          </div>

          <div className="form-actions">
            <p
              className="status-message"
              aria-live="polite"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {saved && <Check size={16} />}
              {status}
            </p>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? (
                "Saving..."
              ) : saved ? (
                <>
                  Saved <Check size={16} />
                </>
              ) : (
                <>
                  Save check-in <Check size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <aside>
          <div className="surface mood-orb">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#4b8e66",
              }}
            >
              <Heart size={18} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Your wellbeing matters
              </span>
            </div>

            <div className="orb" aria-hidden="true">
              <Heart size={42} strokeWidth={1.5} />
            </div>

            <h2>{moodText}</h2>

            <p style={{ marginBottom: 8 }}>{moodDescription}</p>

            <p>
              Whatever you're feeling is valid. Naming it is a caring first
              step.
            </p>
          </div>

          <div className="info-box">
            <Sparkles size={18} style={{ marginBottom: 8 }} />

            <strong>A gentle reminder</strong>

            <p style={{ marginTop: 6 }}>
              Your check-ins help you notice patterns over time. You don't need
              to have everything figured out today.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function WellbeingScale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const numberValue = Number(value);

  const descriptions: Record<string, string[]> = {
    "Overall mood": ["", "Very low", "Low", "Steady", "Good", "Very good"],
    "Stress level": [
      "",
      "Very calm",
      "Mostly calm",
      "Moderate",
      "Stressed",
      "Very stressed",
    ],
    "Anxiety level": [
      "",
      "Very little",
      "A little",
      "Moderate",
      "Quite a lot",
      "Very high",
    ],
  };

  const description = descriptions[label]?.[numberValue] ?? "";
  const lowLabel = label === "Overall mood" ? "Low" : label === "Stress level" ? "Calm" : "Low";
  const highLabel = label === "Overall mood" ? "High" : label === "Stress level" ? "High" : "High";

  return (
    <fieldset className="wellbeing-field">
      <legend className="sr-only">{label}</legend>
      <div className="range-label">
        <span>{label}</span>

        <span className="range-value">{numberValue} / 5</span>
      </div>

      <div className="wellbeing-scale" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((option) => (
          <button
            key={option}
            type="button"
            className={`wellbeing-choice${numberValue === option ? " selected" : ""}`}
            role="radio"
            aria-checked={numberValue === option}
            onClick={() => onChange(String(option))}
          >
            <span>{option}</span>
          </button>
        ))}
      </div>

      <div className="wellbeing-scale-caption">
        <span>{lowLabel}</span>
        <strong>{description}</strong>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}
