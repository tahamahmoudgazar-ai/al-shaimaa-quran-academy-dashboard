import styles from "./StatCard.module.css";

export default function StatCard({ title, value, note, icon: Icon }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span>{title}</span>
        {Icon && <div className={styles.icon}><Icon size={19}/></div>}
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}