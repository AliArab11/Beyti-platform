using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("ProviderApplication")]
[Index("ServiceProviderId", Name = "IX_ProviderApplication_Provider")]
public partial class ProviderApplication
{
    [Key]
    public int Id { get; set; }

    public int ServiceProviderId { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [StringLength(500)]
    public string? Notes { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("ProviderApplication")]
    public virtual ICollection<ProviderApplicationService> ProviderApplicationServices { get; set; } = new List<ProviderApplicationService>();

    [InverseProperty("ProviderApplication")]
    public virtual ICollection<ProviderCertificate> ProviderCertificates { get; set; } = new List<ProviderCertificate>();

    [ForeignKey("ServiceProviderId")]
    [InverseProperty("ProviderApplications")]
    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
