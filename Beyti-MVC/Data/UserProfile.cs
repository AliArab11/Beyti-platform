using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("UserProfile")]
public partial class UserProfile
{
    [Key]
    public int Id { get; set; }

    public string? IdentityUserId { get; set; }

    [StringLength(100)]
    public string? DisplayName { get; set; }

    [StringLength(30)]
    public string RoleType { get; set; } = null!;

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("UserProfile")]
    public virtual AdminProfile? AdminProfile { get; set; }

    [InverseProperty("AdminUser")]
    public virtual ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    [InverseProperty("ActorUser")]
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    [InverseProperty("UserProfile")]
    public virtual Customer? Customer { get; set; }

    [InverseProperty("UserProfile")]
    public virtual Driver? Driver { get; set; }

    [InverseProperty("RecipientUser")]
    public virtual ICollection<Message> MessageRecipientUsers { get; set; } = new List<Message>();

    [InverseProperty("SenderUser")]
    public virtual ICollection<Message> MessageSenderUsers { get; set; } = new List<Message>();

    [InverseProperty("RecipientUser")]
    public virtual ICollection<Notification> NotificationRecipientUsers { get; set; } = new List<Notification>();

    [InverseProperty("SenderUser")]
    public virtual ICollection<Notification> NotificationSenderUsers { get; set; } = new List<Notification>();

    [InverseProperty("UserProfile")]
    public virtual Seller? Seller { get; set; }

    [InverseProperty("UserProfile")]
    public virtual ServiceProvider? ServiceProvider { get; set; }

    [InverseProperty("UserProfile")]
    public virtual ICollection<UserMembership> UserMemberships { get; set; } = new List<UserMembership>();
}
