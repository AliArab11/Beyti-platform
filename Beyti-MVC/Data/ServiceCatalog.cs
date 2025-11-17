using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Table("ServiceCatalog")]
[Index("SubCategoryId", Name = "IX_ServiceCatalog_SubCat")]
public partial class ServiceCatalog
{
    [Key]
    public int Id { get; set; }

    public int SubCategoryId { get; set; }

    [StringLength(120)]
    public string Name { get; set; } = null!;

    [StringLength(255)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MinPrice { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MaxPrice { get; set; }

    public int? EstimatedDuration { get; set; }

    public bool IsActive { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [InverseProperty("ServiceCatalog")]
    public virtual ICollection<ProviderApplicationService> ProviderApplicationServices { get; set; } = new List<ProviderApplicationService>();

    [InverseProperty("ServiceCatalog")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();

    [ForeignKey("SubCategoryId")]
    [InverseProperty("ServiceCatalogs")]
    public virtual SubCategory SubCategory { get; set; } = null!;
}
