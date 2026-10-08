import PageHeader from "../components/PageHeader";

export default function Settings() {
  return (
    <section className="page">
      <PageHeader
        title="Settings"
        description="Configure organisation-level compliance behaviour."
      />
      <div className="settings-grid">
        <div className="panel">
          <h2>Organisation</h2>
          <label>
            Organisation name
            <input defaultValue="Example South African Organisation" />
          </label>
          <label>
            Registration number
            <input defaultValue="2018/123456/07" />
          </label>
          <label>
            Primary compliance officer
            <input defaultValue="Thandi Nkosi" />
          </label>
          <button className="primary-button">Save changes</button>
        </div>
        <div className="panel">
          <h2>Reminder policy</h2>
          <div className="toggle-row">
            <div>
              <strong>30-day reminder</strong>
              <span>Notify the contractor and compliance officer.</span>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="toggle-row">
            <div>
              <strong>14-day reminder</strong>
              <span>Escalate upcoming expiry.</span>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="toggle-row">
            <div>
              <strong>7-day reminder</strong>
              <span>Send urgent expiry notification.</span>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="toggle-row">
            <div>
              <strong>Expired escalation</strong>
              <span>Flag the contractor on the dashboard.</span>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
      </div>
    </section>
  );
}
