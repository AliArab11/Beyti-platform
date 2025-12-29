using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

/// <summary>
/// Tracks which users have read which announcements
/// </summary>
[PrimaryKey(nameof(AnnouncementId), nameof(UserProfileId))]
public partial class AnnouncementRead
{
    public int AnnouncementId { get; set; }

    public int UserProfileId { get; set; }

    [Precision(3)]
    public DateTime ReadAt { get; set; }

    [ForeignKey("AnnouncementId")]
    [InverseProperty("AnnouncementReads")]
    public virtual Announcement Announcement { get; set; } = null!;

    [ForeignKey("UserProfileId")]
    [InverseProperty("AnnouncementReads")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
