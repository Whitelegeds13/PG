function StatusBadge({ value }) {
  return (
    <span className={`status status-${String(value).replaceAll('_', '-')}`}>
      {String(value).replaceAll('_', ' ')}
    </span>
  );
}

export default StatusBadge;
