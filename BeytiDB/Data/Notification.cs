using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Notification")]
[Index("RecipientUserId", "IsRead", Name = "IX_Notification_Recipient_Read")]
[Index("Type", Name = "IX_Notification_Type")]
public partial class Notification
{
    [Key]
    public int Id { get; set; }

    public int RecipientUserId { get; set; }

    public int? SenderUserId { get; set; }

    [StringLength(50)]
    public string Type { get; set; } = null!;

    [StringLength(120)]
    public string? Title { get; set; }

    public string Body { get; set; } = null!;

    [StringLength(30)]
    public string? RelatedEntityType { get; set; }

    public int? RelatedEntityId { get; set; }

    public bool IsRead { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("RecipientUserId")]
    [InverseProperty("NotificationRecipientUsers")]
    public virtual UserProfile RecipientUser { get; set; } = null!;

    [ForeignKey("SenderUserId")]
    [InverseProperty("NotificationSenderUsers")]
    public virtual UserProfile? SenderUser { get; set; }
}
