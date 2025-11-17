using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("AdminProfile")]
[Index("UserProfileId", Name = "UQ__AdminPro__9E267F63F21F410D", IsUnique = true)]
public partial class AdminProfile
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    [StringLength(100)]
    public string? Title { get; set; }

    public string? Permissions { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("UserProfileId")]
    [InverseProperty("AdminProfile")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
