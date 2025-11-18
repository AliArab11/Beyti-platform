using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Index("ActorUserId", Name = "IX_AuditLogs_Actor")]
[Index("EventType", Name = "IX_AuditLogs_EventType")]
[Index("TargetTable", "TargetId", Name = "IX_AuditLogs_Target")]
public partial class AuditLog
{
    [Key]
    public int Id { get; set; }

    public int? ActorUserId { get; set; }

    [StringLength(80)]
    public string EventType { get; set; } = null!;

    [StringLength(100)]
    public string? TargetTable { get; set; }

    public int? TargetId { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(20)]
    public string? Severity { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("ActorUserId")]
    [InverseProperty("AuditLogs")]
    public virtual UserProfile? ActorUser { get; set; }
}
