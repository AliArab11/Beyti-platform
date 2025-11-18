using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ProviderCertificate")]
[Index("ProviderApplicationId", Name = "IX_ProviderCertificate_App")]
public partial class ProviderCertificate
{
    [Key]
    public int Id { get; set; }

    public int ProviderApplicationId { get; set; }

    [StringLength(120)]
    public string Title { get; set; } = null!;

    [StringLength(300)]
    public string? FileUrl { get; set; }

    public DateOnly? ExpiresAt { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("ProviderApplicationId")]
    [InverseProperty("ProviderCertificates")]
    public virtual ProviderApplication ProviderApplication { get; set; } = null!;
}
