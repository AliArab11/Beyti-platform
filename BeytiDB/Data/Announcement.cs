using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Index("IsActive", "ExpiresAt", Name = "IX_Announcements_Active")]
public partial class Announcement
{
    [Key]
    public int Id { get; set; }

    public int AdminUserId { get; set; }

    [StringLength(200)]
    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    [StringLength(50)]
    public string Audience { get; set; } = null!;

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime? ExpiresAt { get; set; }

    [ForeignKey("AdminUserId")]
    [InverseProperty("Announcements")]
    public virtual UserProfile AdminUser { get; set; } = null!;
}
